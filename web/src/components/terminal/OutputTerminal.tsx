import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  FileText,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ListChecks,
} from 'lucide-react';
import type { DsaTestCase, DsaRunSummary, DsaSubmissionResult } from '../../types/dsa';
import { TestCaseTab } from '../dsa/TestCaseTab';
import { TestResultTab } from '../dsa/TestResultTab';

export type BottomPanelTab = 'testcases' | 'results' | 'output';

interface Props {
  logs: string[];
  failureCount: number;
  activeTab?: BottomPanelTab;
  onTabChange?: (tab: BottomPanelTab) => void;
  onClear: () => void;
  testCases?: DsaTestCase[];
  onUpdateTestCase?: (testCase: DsaTestCase) => void;
  onAddTestCase?: () => void;
  onRemoveTestCase?: (id: string) => void;
  dsaRunSummary?: DsaRunSummary | null;
  isDsaRunning?: boolean;
  dsaSubmissionResult?: DsaSubmissionResult | null;
  isSubmitting?: boolean;
}

const XTERM_THEME = {
  background: '#141415',
  foreground: '#d4d4d8',
  cursor: '#ededed',
  cursorAccent: '#141415',
  selectionBackground: 'rgba(255, 255, 255, 0.12)',
  black: '#19191b',
  red: '#e5484d',
  green: '#4cc38a',
  yellow: '#f5d90a',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#38bdf8',
  white: '#ededed',
  brightBlack: '#71717a',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fde047',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff',
};

export function OutputTerminal({
  logs,
  failureCount,
  activeTab: controlledTab,
  onTabChange,
  onClear,
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
  const [copied, setCopied] = useState(false);

  const currentTab = controlledTab ?? internalTab;

  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const outputTermRef = useRef<Terminal | null>(null);
  const outputFitRef = useRef<FitAddon | null>(null);
  const renderedCountRef = useRef<number>(0);

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

  // Initialize Output Xterm
  useEffect(() => {
    if (!outputContainerRef.current) return;

    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      lineHeight: 1.5,
      cursorBlink: false,
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(outputContainerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[90mConsole ready. Run tests or submit to evaluate output.\x1b[0m');

    outputTermRef.current = term;
    outputFitRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Synchronize Output logs
  useEffect(() => {
    const term = outputTermRef.current;
    if (!term) return;

    if (logs.length === 0) {
      term.clear();
      term.writeln('\x1b[90mConsole ready. Run tests or submit to evaluate output.\x1b[0m');
      renderedCountRef.current = 0;
      return;
    }

    const newLogs = logs.slice(renderedCountRef.current);
    for (const log of newLogs) {
      term.writeln(log);
    }
    renderedCountRef.current = logs.length;
  }, [logs]);

  // Fit addon on tab change or collapse toggle
  useEffect(() => {
    if (isCollapsed) return;
    const timer = setTimeout(() => {
      if (currentTab === 'output') {
        outputFitRef.current?.fit();
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [currentTab, isCollapsed]);

  const handleClear = () => {
    if (currentTab === 'output') {
      onClear();
      outputTermRef.current?.clear();
      outputTermRef.current?.writeln(
        '\x1b[90mConsole ready. Run tests or submit to evaluate output.\x1b[0m'
      );
      renderedCountRef.current = 0;
    }
  };

  const handleCopy = async () => {
    try {
      if (currentTab === 'output') {
        const textToCopy =
          logs.length > 0
            ? logs
                // eslint-disable-next-line no-control-regex
                .map((line) => line.replace(/\x1b\[[0-9;]*m/g, ''))
                .join('\n')
            : 'Output is empty';
        await navigator.clipboard.writeText(textToCopy);
      } else if (currentTab === 'results') {
        const toCopy = dsaSubmissionResult || dsaRunSummary;
        if (toCopy) {
          await navigator.clipboard.writeText(JSON.stringify(toCopy, null, 2));
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard write failed silently
    }
  };

  return (
    <section
      className={`${
        isCollapsed ? 'h-10' : 'h-64'
      } bg-[#141415] border-t border-white/[0.08] flex flex-col shrink-0`}
    >
      <div className="h-10 bg-[#0f0f10] border-b border-white/[0.08] flex items-center justify-between text-xs select-none pr-3">
        <div className="flex items-center h-full">
          {/* Test Cases Tab */}
          <button
            type="button"
            onClick={() => setTab('testcases')}
            className={`h-full flex items-center gap-2 px-3.5 text-xs border-r cursor-pointer transition-colors ${
              currentTab === 'testcases'
                ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.06] hover:text-[#ededed] hover:bg-[#141415]/50'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Test cases</span>
          </button>

          {/* Test Result Tab */}
          <button
            type="button"
            onClick={() => setTab('results')}
            className={`h-full flex items-center gap-2 px-3.5 text-xs border-r cursor-pointer transition-colors ${
              currentTab === 'results'
                ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.06] hover:text-[#ededed] hover:bg-[#141415]/50'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Test result</span>
            {dsaSubmissionResult ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-mono tabular-nums ${
                  dsaSubmissionResult.status === 'Accepted'
                    ? 'bg-emerald-500/10 text-[#4cc38a]'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {dsaSubmissionResult.passedCount}/{dsaSubmissionResult.totalCount}
              </span>
            ) : dsaRunSummary ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-mono tabular-nums ${
                  dsaRunSummary.status === 'passed'
                    ? 'bg-emerald-500/10 text-[#4cc38a]'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {dsaRunSummary.passed}/{dsaRunSummary.total}
              </span>
            ) : null}
          </button>

          {/* Console / Output Tab */}
          <button
            type="button"
            onClick={() => setTab('output')}
            className={`h-full flex items-center gap-2 px-3.5 text-xs border-r cursor-pointer transition-colors ${
              currentTab === 'output'
                ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.06] hover:text-[#ededed] hover:bg-[#141415]/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Console</span>
          </button>

          {failureCount > 0 && currentTab === 'output' && (
            <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono tabular-nums ml-2.5">
              failed ({failureCount})
            </span>
          )}

          {(isDsaRunning || isSubmitting) && (
            <span className="flex items-center gap-1.5 text-xs text-[#a1a1a6] ml-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a] inline-block" />
              <span>{isSubmitting ? 'Grading…' : 'Running tests…'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors"
            title={copied ? 'Copied' : 'Copy'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 stroke-[1.5] text-[#4cc38a]" />
            ) : (
              <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
            )}
          </button>
          {currentTab === 'output' && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors"
              title="Clear console"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors"
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

        {/* Output Xterm Container */}
        <div
          ref={outputContainerRef}
          className={`h-full w-full px-4 py-3 ${currentTab === 'output' ? 'block' : 'hidden'}`}
        />
      </div>
    </section>
  );
}
