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
    <div className="flex-1 flex flex-col h-full bg-[#141415] text-[#ededed] overflow-hidden">
      {/* Test Case Selector */}
      <div className="h-10 px-4 bg-[#0f0f10] border-b border-white/[0.08] flex items-center shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {testCases.map((tc, index) => {
            const isSelected = tc.id === activeCase?.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setActiveCaseId(tc.id)}
                className={`h-7 flex items-center gap-1.5 px-3 text-xs rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#232325] text-[#ededed] font-medium border border-white/[0.08]'
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
                    <X className="w-3 h-3 stroke-[1.5]" />
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddTestCase}
            className="h-7 flex items-center gap-1 text-xs text-[#85858b] hover:text-[#ededed] px-2.5 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Add test case"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="text-[11px]">Add case</span>
          </button>
        </div>
      </div>

      {/* Selected Case Fields */}
      {activeCase ? (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] font-sans font-medium text-[#85858b] mb-1.5">
              Input parameters
            </label>
            <input
              type="text"
              value={activeCase.input}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, input: e.target.value })
              }
              placeholder="nums = [2, 7, 11, 15], target = 9"
              className="w-full bg-[#0f0f10] border border-white/[0.08] focus:border-white/[0.2] rounded-md px-3 py-2 text-[#ededed] font-mono text-xs outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium text-[#85858b] mb-1.5">
              Expected output
            </label>
            <input
              type="text"
              value={activeCase.expectedOutput}
              onChange={(e) =>
                onUpdateTestCase({ ...activeCase, expectedOutput: e.target.value })
              }
              placeholder="[0, 1]"
              className="w-full bg-[#0f0f10] border border-white/[0.08] focus:border-white/[0.2] rounded-md px-3 py-2 text-[#ededed] font-mono text-xs outline-none transition-colors"
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
