import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import type { DsaRunSummary } from '../../types/dsa';

interface Props {
  runSummary: DsaRunSummary | null;
  isRunning: boolean;
}

export function TestResultTab({ runSummary, isRunning }: Props) {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  if (isRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-xs text-[#85858b] space-y-2">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Evaluating test cases against execution engine...</span>
      </div>
    );
  }

  if (!runSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-xs text-[#85858b] p-4 text-center">
        <span>No test results yet. Click "Run Test Cases" to test your solution.</span>
      </div>
    );
  }

  const activeResult = runSummary.results[selectedCaseIndex] || runSummary.results[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141415] text-[#ededed] overflow-hidden select-text">
      {/* Summary Header */}
      <div className="px-4 py-2.5 bg-[#0f0f10] border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {runSummary.status === 'passed' ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
              <span>Accepted</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
              <XCircle className="w-4 h-4 stroke-[2]" />
              <span>Wrong Answer</span>
            </div>
          )}

          <span className="text-xs font-mono text-[#a1a1a6]">
            {runSummary.passed}/{runSummary.total} Test Cases Passed
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[#85858b]">
          <Clock className="w-3 h-3" />
          <span>{runSummary.executionTimeMs} ms</span>
        </div>
      </div>

      {/* Case Selector Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141415] border-b border-white/[0.06] shrink-0 overflow-x-auto custom-scrollbar">
        {runSummary.results.map((res, idx) => {
          const isSelected = idx === selectedCaseIndex;
          return (
            <button
              key={res.testCaseId}
              type="button"
              onClick={() => setSelectedCaseIndex(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#222226] text-[#ededed] font-medium border border-white/[0.1]'
                  : 'text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04]'
              }`}
            >
              {res.passed ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              )}
              <span>{res.testCaseName}</span>
            </button>
          );
        })}
      </div>

      {/* Case Details View */}
      {activeResult && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
          {activeResult.errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="whitespace-pre-wrap">{activeResult.errorMessage}</div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-sans font-medium text-[#85858b] mb-1">
              Your Output:
            </div>
            <div
              className={`p-2.5 rounded bg-[#0d0d0e] border font-mono ${
                activeResult.passed
                  ? 'border-emerald-500/20 text-emerald-400'
                  : 'border-rose-500/20 text-rose-400'
              }`}
            >
              {activeResult.actualOutput}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-sans font-medium text-[#85858b] mb-1">
              Expected Output:
            </div>
            <div className="p-2.5 rounded bg-[#0d0d0e] border border-white/[0.08] text-sky-400 font-mono">
              {activeResult.expectedOutput}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
