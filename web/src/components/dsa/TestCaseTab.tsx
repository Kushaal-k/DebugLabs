import { useState } from 'react';
import { Plus, Trash2, Play, Loader2 } from 'lucide-react';
import type { DsaTestCase } from '../../types/dsa';

interface Props {
  testCases: DsaTestCase[];
  onUpdateTestCase: (testCase: DsaTestCase) => void;
  onAddTestCase: () => void;
  onRemoveTestCase: (id: string) => void;
  onRunTestCases: () => void;
  isRunning: boolean;
}

export function TestCaseTab({
  testCases,
  onUpdateTestCase,
  onAddTestCase,
  onRemoveTestCase,
  onRunTestCases,
  isRunning,
}: Props) {
  const [activeCaseId, setActiveCaseId] = useState<string>(
    testCases[0]?.id || ''
  );

  const activeCase =
    testCases.find((tc) => tc.id === activeCaseId) || testCases[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141415] text-[#ededed] overflow-hidden">
      {/* Test Case Pill Selector & Actions */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0f0f10] border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {testCases.map((tc, index) => {
            const isSelected = tc.id === activeCase?.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setActiveCaseId(tc.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[4px] cursor-pointer transition-colors duration-100 ${
                  isSelected
                    ? 'bg-[#222226] text-[#ededed] font-medium border border-white/[0.12]'
                    : 'text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04]'
                }`}
              >
                <span>{tc.name || `Case ${index + 1}`}</span>
                {tc.isCustom && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTestCase(tc.id);
                      if (activeCaseId === tc.id) {
                        const remaining = testCases.filter((t) => t.id !== tc.id);
                        if (remaining.length > 0) setActiveCaseId(remaining[0].id);
                      }
                    }}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors"
                    title="Remove custom case"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddTestCase}
            className="flex items-center gap-1 text-xs text-[#85858b] hover:text-[#ededed] px-2 py-1 rounded hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Add Custom Test Case"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Add Case</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRunTestCases}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs px-3 py-1 rounded-[5px] cursor-pointer transition-colors shrink-0 shadow-sm"
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white" />
          )}
          <span>{isRunning ? 'Running...' : 'Run Test Cases'}</span>
        </button>
      </div>

      {/* Selected Test Case Editor */}
      {activeCase ? (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
          <div>
            <label className="block text-[11px] font-sans font-medium text-[#85858b] mb-1">
              Input Parameters:
            </label>
            <input
              type="text"
              value={activeCase.input}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, input: e.target.value })
              }
              placeholder="e.g. nums = [2, 7, 11, 15], target = 9"
              className="w-full bg-[#0d0d0e] border border-white/[0.08] focus:border-emerald-500/50 rounded px-2.5 py-1.5 text-[#ededed] font-mono text-xs outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium text-[#85858b] mb-1">
              Expected Output:
            </label>
            <input
              type="text"
              value={activeCase.expectedOutput}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, expectedOutput: e.target.value })
              }
              placeholder="e.g. [0, 1]"
              className="w-full bg-[#0d0d0e] border border-white/[0.08] focus:border-emerald-500/50 rounded px-2.5 py-1.5 text-[#ededed] font-mono text-xs outline-none transition-colors"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[#85858b]">
          No test cases available. Click "Add Case" to create one.
        </div>
      )}
    </div>
  );
}
