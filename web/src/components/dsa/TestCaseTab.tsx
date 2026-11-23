import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { DsaTestCase } from '../../types/dsa';

interface Props {
  testCases: DsaTestCase[];
  onUpdateTestCase: (testCase: DsaTestCase) => void;
  onAddTestCase: () => void;
  onRemoveTestCase: (id: string) => void;
}

export function TestCaseTab({
  testCases,
  onUpdateTestCase,
  onAddTestCase,
  onRemoveTestCase,
}: Props) {
  const [activeCaseId, setActiveCaseId] = useState<string>(
    testCases[0]?.id || ''
  );

  const activeCase =
    testCases.find((tc) => tc.id === activeCaseId) || testCases[0];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden text-[#ededed]">
      <div className="flex h-10 shrink-0 items-center border-b border-white/[0.08] px-4">
        <div className="custom-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {testCases.map((tc, index) => {
            const isSelected = tc.id === activeCase?.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setActiveCaseId(tc.id)}
                className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                  isSelected
                    ? 'border border-white/[0.12] bg-white/[0.1] font-medium text-[#ededed]'
                    : 'text-[#85858b] hover:bg-white/[0.05] hover:text-[#ededed]'
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
                    <X className="w-3 h-3 stroke-[1.5]" />
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddTestCase}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs text-[#85858b] transition-colors hover:bg-white/[0.06] hover:text-[#ededed]"
            title="Add test case"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="text-[11px]">Add case</span>
          </button>
        </div>
      </div>

      {/* Selected Case Fields */}
      {activeCase ? (
        <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5 font-mono text-xs">
          <div className="space-y-1">
            <label className="block font-sans text-[11px] font-medium text-[#85858b]">
              Input parameters
            </label>
            <input
              type="text"
              value={activeCase.input}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, input: e.target.value })
              }
              placeholder="nums = [2, 7, 11, 15], target = 9"
              className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-1.5 font-mono text-xs text-[#ededed] outline-none transition-colors focus:border-white/25 focus:ring-1 focus:ring-white/10"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-sans text-[11px] font-medium text-[#85858b]">
              Expected output
            </label>
            <input
              type="text"
              value={activeCase.expectedOutput}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, expectedOutput: e.target.value })
              }
              placeholder="[0, 1]"
              className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-1.5 font-mono text-xs text-[#ededed] outline-none transition-colors focus:border-white/25 focus:ring-1 focus:ring-white/10"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[#85858b]">
          No test cases available. Click "Add case" to create one.
        </div>
      )}
    </div>
  );
}
