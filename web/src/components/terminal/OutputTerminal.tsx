import { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ListChecks,
} from 'lucide-react';
import type { DsaTestCase, DsaRunSummary, DsaSubmissionResult } from '../../types/dsa';
import { TestCaseTab } from '../dsa/TestCaseTab';
import { TestResultTab } from '../dsa/TestResultTab';

export type BottomPanelTab = 'testcases' | 'results';

interface Props {
  height?: number;
  activeTab?: BottomPanelTab;
  onTabChange?: (tab: BottomPanelTab) => void;
  testCases?: DsaTestCase[];
  onUpdateTestCase?: (testCase: DsaTestCase) => void;
  onAddTestCase?: () => void;
  onRemoveTestCase?: (id: string) => void;
  dsaRunSummary?: DsaRunSummary | null;
  isDsaRunning?: boolean;
  dsaSubmissionResult?: DsaSubmissionResult | null;
  isSubmitting?: boolean;
}

export function OutputTerminal({
  height = 260,
  activeTab: controlledTab,
  onTabChange,
  testCases = [],
  onUpdateTestCase,
  onAddTestCase,
  onRemoveTestCase,
  dsaRunSummary = null,
  isDsaRunning = false,
  dsaSubmissionResult = null,
  isSubmitting = false,
}: Props) {
  const [internalTab, setInternalTab] = useState<BottomPanelTab>('testcases');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentTab = controlledTab ?? internalTab;

  const setTab = useCallback(
    (tab: BottomPanelTab) => {
      setIsCollapsed(false);
      if (onTabChange) {
        onTabChange(tab);
      } else {
        setInternalTab(tab);
      }
    },
    [onTabChange]
  );

  return (
    <section
      style={{ height: isCollapsed ? 44 : height }}
      className="glass-panel flex shrink-0 select-none flex-col overflow-hidden rounded-2xl transition-[height] duration-75"
    >
      <div className="flex h-11 items-center justify-between border-b border-white/[0.08] px-3 text-xs">
        <div className="flex h-full items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-black/20 p-0.5">
          <button
            type="button"
            onClick={() => setTab('testcases')}
            className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
              currentTab === 'testcases'
                ? 'bg-white/[0.14] font-medium text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'text-[#85858b] hover:text-[#ededed]'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Test cases</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('results')}
            className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
              currentTab === 'results'
                ? 'bg-white/[0.14] font-medium text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'text-[#85858b] hover:text-[#ededed]'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Test result</span>
          </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="cursor-pointer rounded-full p-1.5 text-[#85858b] transition-colors hover:bg-white/[0.08] hover:text-[#ededed]"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 stroke-[1.5]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden relative ${
          isCollapsed ? 'hidden' : 'block'
        }`}
      >
        {/* Test Cases View */}
        {currentTab === 'testcases' && onUpdateTestCase && onAddTestCase && onRemoveTestCase && (
          <TestCaseTab
            testCases={testCases}
            onUpdateTestCase={onUpdateTestCase}
            onAddTestCase={onAddTestCase}
            onRemoveTestCase={onRemoveTestCase}
          />
        )}

        {/* Test Results View */}
        {currentTab === 'results' && (
          <TestResultTab
            runSummary={dsaRunSummary}
            submissionResult={dsaSubmissionResult}
            isRunning={isDsaRunning || isSubmitting}
          />
        )}
      </div>
    </section>
  );
}
