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
      style={{ height: isCollapsed ? 40 : height }}
      className="bg-[#0f0f12]/60 backdrop-blur-xl border-t border-white/[0.08] flex flex-col shrink-0 select-none shadow-[0_-4px_30px_rgba(0,0,0,0.3)] transition-[height] duration-75"
    >
      <div className="h-10 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between text-xs pr-3">
        <div className="flex items-center h-full">
          {/* Test Cases Tab */}
          <button
            type="button"
            onClick={() => setTab('testcases')}
            className={`h-full flex items-center gap-2 px-4 text-xs border-r cursor-pointer transition-colors ${
              currentTab === 'testcases'
                ? 'bg-white/[0.06] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'text-[#85858b] border-r-white/[0.06] hover:text-[#ededed] hover:bg-white/[0.03]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Test cases</span>
          </button>

          {/* Test Result Tab */}
          <button
            type="button"
            onClick={() => setTab('results')}
            className={`h-full flex items-center gap-2 px-4 text-xs border-r cursor-pointer transition-colors ${
              currentTab === 'results'
                ? 'bg-white/[0.06] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'text-[#85858b] border-r-white/[0.06] hover:text-[#ededed] hover:bg-white/[0.03]'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Test result</span>
            {dsaSubmissionResult ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums backdrop-blur-sm ${
                  dsaSubmissionResult.status === 'Accepted'
                    ? 'bg-emerald-500/10 text-[#4cc38a] border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {dsaSubmissionResult.passedCount}/{dsaSubmissionResult.totalCount}
              </span>
            ) : dsaRunSummary ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums backdrop-blur-sm ${
                  dsaRunSummary.status === 'passed'
                    ? 'bg-emerald-500/10 text-[#4cc38a] border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {dsaRunSummary.passed}/{dsaRunSummary.total}
              </span>
            ) : null}
          </button>

          {(isDsaRunning || isSubmitting) && (
            <span className="flex items-center gap-2 text-xs text-[#a1a1a6] ml-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a] inline-block shadow-[0_0_8px_rgba(76,195,138,0.5)]" />
              <span>{isSubmitting ? 'Grading…' : 'Running tests…'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors backdrop-blur-sm"
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
