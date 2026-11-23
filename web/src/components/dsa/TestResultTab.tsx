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
      <div className="flex h-full flex-1 flex-col items-center justify-center space-y-2 text-xs text-[#85858b]">
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
      <div className="flex h-full flex-1 flex-col items-center justify-center space-y-1 p-4 text-center text-xs text-[#85858b]">
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
    <div className="flex h-full flex-1 select-text flex-col overflow-hidden text-[#ededed]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
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
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#85858b] tabular-nums">
          <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>{executionTimeMs} ms</span>
        </div>
      </div>

      {/* Case Selector Pills */}
      {results.length > 0 && (
        <div className="custom-scrollbar flex h-9 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] px-4">
          {results.map((res, idx) => {
            const isSelected = idx === selectedCaseIndex;
            return (
              <button
                key={res.testCaseId || `case-${idx}`}
                type="button"
                onClick={() => setSelectedCaseIndex(idx)}
                className={`flex h-6 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs transition-colors ${
                  isSelected
                    ? 'border border-white/[0.12] bg-white/[0.1] font-medium text-[#ededed]'
                    : 'text-[#85858b] hover:bg-white/[0.05] hover:text-[#ededed]'
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
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-mono text-xs">
          {activeResult.errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="whitespace-pre-wrap">{activeResult.errorMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="font-sans text-[11px] font-medium text-[#85858b]">
                Your output
              </div>
              <div
                className={`rounded-lg border bg-black/40 px-3 py-2 font-mono text-xs min-h-[36px] flex items-center ${
                  activeResult.passed
                    ? 'border-white/[0.08] text-[#ededed]'
                    : 'border-rose-500/25 bg-rose-500/[0.04] text-rose-300'
                }`}
              >
                {activeResult.actualOutput || (activeResult.passed ? '(Empty output)' : '(No output)')}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-sans text-[11px] font-medium text-[#85858b]">
                Expected output
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-xs text-[#ededed] min-h-[36px] flex items-center">
                {activeResult.hidden && !activeResult.passed
                  ? '[Hidden test case output]'
                  : activeResult.expectedOutput}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
