import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import type { DsaRunSummary, DsaSubmissionResult } from '../../types/dsa';

interface Props {
  runSummary: DsaRunSummary | null;
  submissionResult?: DsaSubmissionResult | null;
  isRunning: boolean;
}

export function TestResultTab({
  runSummary,
  submissionResult,
  isRunning,
}: Props) {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  if (isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-xs text-[#85858b] space-y-2 bg-[#0d0d10]/60 backdrop-blur-xl">
        <div className="w-4 h-4 border-2 border-white/[0.2] border-t-white rounded-full animate-spin" />
        <span>Evaluating code against test cases…</span>
      </div>
    );
  }

  const isSubmission = Boolean(submissionResult);
  const results = isSubmission
    ? submissionResult?.details || []
    : runSummary?.results || [];

  if (!submissionResult && !runSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-xs text-[#85858b] p-4 text-center space-y-1 bg-[#0d0d10]/60 backdrop-blur-xl">
        <span className="text-[#ededed] font-medium">No test results yet</span>
        <span>Run test cases to evaluate your solution</span>
      </div>
    );
  }

  const verdict = isSubmission
    ? submissionResult!.status
    : runSummary?.verdict ||
      (runSummary?.status === 'passed' ? 'Accepted' : 'Wrong Answer');

  const isAccepted = verdict === 'Accepted';
  const passedCount = isSubmission ? submissionResult!.passedCount : runSummary!.passed;
  const totalCount = isSubmission ? submissionResult!.totalCount : runSummary!.total;
  const executionTimeMs = isSubmission
    ? submissionResult!.executionTimeMs
    : runSummary!.executionTimeMs;

  const activeResult = results[selectedCaseIndex] || results[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d10]/60 backdrop-blur-xl text-[#ededed] overflow-hidden select-text">
      {/* Summary Header */}
      <div className="h-10 px-4 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isAccepted ? (
            <div className="flex items-center gap-1.5 text-[#4cc38a] font-medium text-xs">
              <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
              <span>{isSubmission ? 'Submission accepted' : 'Passed'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 font-medium text-xs">
              <XCircle className="w-4 h-4 stroke-[1.5]" />
              <span>{verdict}</span>
            </div>
          )}

          <span className="text-xs font-mono text-[#a1a1a6] tabular-nums">
            {passedCount}/{totalCount} test cases passed
            {isSubmission && ' (all test suites)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#85858b] tabular-nums">
          <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>{executionTimeMs} ms</span>
        </div>
      </div>

      {/* Case Selector Pills */}
      {results.length > 0 && (
        <div className="h-9 px-4 bg-white/[0.01] border-b border-white/[0.06] flex items-center gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
          {results.map((res, idx) => {
            const isSelected = idx === selectedCaseIndex;
            return (
              <button
                key={res.testCaseId || `case-${idx}`}
                type="button"
                onClick={() => setSelectedCaseIndex(idx)}
                className={`h-6 flex items-center gap-1.5 px-2.5 text-xs rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] text-[#ededed] font-medium border border-white/[0.14] backdrop-blur-sm shadow-sm'
                    : 'text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    res.passed ? 'bg-[#4cc38a]' : 'bg-rose-400'
                  }`}
                />
                <span>{res.testCaseName || (res.hidden ? `Hidden ${idx + 1}` : `Case ${idx + 1}`)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Details View */}
      {activeResult && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
          {activeResult.errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-start gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="whitespace-pre-wrap">{activeResult.errorMessage}</div>
            </div>
          )}

          <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-sans font-medium text-[#85858b]">
              Your output
            </div>
            <div
              className={`p-3 rounded-lg bg-black/40 backdrop-blur-md border font-mono ${
                activeResult.passed
                  ? 'border-white/[0.08] text-[#ededed]'
                  : 'border-rose-500/20 text-rose-400'
              }`}
            >
              {activeResult.actualOutput || (activeResult.passed ? '(Empty output)' : '(No output)')}
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-sans font-medium text-[#85858b]">
              Expected output
            </div>
            <div className="p-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/[0.08] text-[#ededed] font-mono">
              {activeResult.hidden && !activeResult.passed
                ? '[Hidden test case output]'
                : activeResult.expectedOutput}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
