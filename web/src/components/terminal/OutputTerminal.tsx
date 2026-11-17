import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  FileText,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type BottomPanelTab = 'output' | 'terminal';

interface Props {
  logs: string[];
  isRunning: boolean;
  failureCount: number;
  activeTab?: BottomPanelTab;
  onTabChange?: (tab: BottomPanelTab) => void;
  onClear: () => void;
}

const XTERM_THEME = {
  background: '#141415',
  foreground: '#d4d4d8',
  cursor: '#ededed',
  cursorAccent: '#141415',
  selectionBackground: 'rgba(255, 255, 255, 0.15)',
  black: '#1e1e21',
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
  isRunning,
  failureCount,
  activeTab: controlledTab,
  onTabChange,
  onClear,
}: Props) {
  const [internalTab, setInternalTab] = useState<BottomPanelTab>('output');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentTab = controlledTab ?? internalTab;

  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  const outputTermRef = useRef<Terminal | null>(null);
  const terminalTermRef = useRef<Terminal | null>(null);

  const outputFitRef = useRef<FitAddon | null>(null);
  const terminalFitRef = useRef<FitAddon | null>(null);

  const renderedCountRef = useRef<number>(0);

  const setTab = useCallback(
    (tab: BottomPanelTab) => {
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
      fontSize: 12.5,
      lineHeight: 1.45,
      cursorBlink: false,
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(outputContainerRef.current);
    fitAddon.fit();

    term.writeln(
      '\x1b[90mOutput ready. Click "Run" in toolbar to execute active file.\x1b[0m'
    );

    outputTermRef.current = term;
    outputFitRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Initialize Interactive Terminal Xterm
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5,
      lineHeight: 1.45,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[90mDebugLabs interactive session\x1b[0m');
    term.writeln(
      '\x1b[90mSession: standby · interactive PTY gateway unattached on this branch\x1b[0m'
    );
    term.writeln(
      '\x1b[90mSingle-file executions stream to the Output tab.\x1b[0m'
    );
    term.write('\r\n$ ');

    let currentInput = '';
    term.onData((data) => {
      if (data === '\r') {
        term.write('\r\n');
        const cmd = currentInput.trim();
        if (cmd === 'clear') {
          term.clear();
        } else if (cmd === 'help') {
          term.writeln('Available commands: help, clear, status');
        } else if (cmd === 'status') {
          term.writeln('Container runner: Docker sandbox');
          term.writeln('Interactive PTY: Unattached');
        } else if (cmd.length > 0) {
          term.writeln(
            `debuglabs: pty gateway is unattached (cannot execute '${cmd}')`
          );
        }
        currentInput = '';
        term.write('$ ');
      } else if (data === '\u007F') {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data >= ' ' || data === '\t') {
        currentInput += data;
        term.write(data);
      }
    });

    terminalTermRef.current = term;
    terminalFitRef.current = fitAddon;

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
      term.writeln(
        '\x1b[90mOutput ready. Click "Run" in toolbar to execute active file.\x1b[0m'
      );
      renderedCountRef.current = 0;
      return;
    }

    const newLogs = logs.slice(renderedCountRef.current);
    newLogs.forEach((line) => term.writeln(line));
    renderedCountRef.current = logs.length;
  }, [logs]);

  // Fit addons on tab change or collapse toggle
  useEffect(() => {
    if (isCollapsed) return;
    const timer = setTimeout(() => {
      if (currentTab === 'output') {
        outputFitRef.current?.fit();
      } else {
        terminalFitRef.current?.fit();
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [currentTab, isCollapsed]);

  const handleClear = () => {
    if (currentTab === 'output') {
      onClear();
      outputTermRef.current?.clear();
      outputTermRef.current?.writeln(
        '\x1b[90mOutput ready. Click "Run" in toolbar to execute active file.\x1b[0m'
      );
      renderedCountRef.current = 0;
    } else {
      terminalTermRef.current?.clear();
      terminalTermRef.current?.write('$ ');
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
            : 'Output is empty.';
        await navigator.clipboard.writeText(textToCopy);
      } else {
        await navigator.clipboard.writeText('DebugLabs interactive session');
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
        isCollapsed ? 'h-9' : 'h-56'
      } bg-[#141415] border-t border-white/[0.08] flex flex-col shrink-0`}
    >
      <div className="h-9 bg-[#0f0f10] border-b border-white/[0.08] flex items-center justify-between text-xs select-none pr-3">
        <div className="flex items-center h-full">
          <div className="flex items-center h-full">
            <button
              type="button"
              onClick={() => setTab('output')}
              className={`h-full flex items-center gap-2 px-3.5 text-xs border-r cursor-pointer transition-colors duration-150 ${
                currentTab === 'output'
                  ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                  : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.05] hover:text-[#ededed] hover:bg-[#141415]/50'
              }`}
            >
              <FileText
                className={`w-3.5 h-3.5 stroke-[1.5] ${
                  currentTab === 'output' ? 'text-[#ededed]' : 'text-[#85858b]'
                }`}
              />
              <span>Output</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('terminal')}
              className={`h-full flex items-center gap-2 px-3.5 text-xs border-r cursor-pointer transition-colors duration-150 ${
                currentTab === 'terminal'
                  ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                  : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.05] hover:text-[#ededed] hover:bg-[#141415]/50'
              }`}
            >
              <TerminalIcon
                className={`w-3.5 h-3.5 stroke-[1.5] ${
                  currentTab === 'terminal' ? 'text-[#ededed]' : 'text-[#85858b]'
                }`}
              />
              <span>Terminal</span>
            </button>
          </div>

          {failureCount > 0 && (
            <span className="flex items-center gap-1 bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20 px-1.5 py-0.5 rounded-[3px] text-[11px] font-mono tabular-nums ml-3">
              failed ({failureCount})
            </span>
          )}

          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-[#a1a1a6] ml-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 inline-block" />
              <span>Running…</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-[4px] cursor-pointer transition-colors duration-150"
            title={copied ? 'Copied to clipboard' : `Copy ${currentTab}`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 stroke-[1.5] text-[#4cc38a]" />
            ) : (
              <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-[4px] cursor-pointer transition-colors duration-150"
            title={`Clear ${currentTab}`}
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] rounded-[4px] cursor-pointer transition-colors duration-150"
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
        className={`flex-1 px-3 py-2.5 overflow-hidden relative ${
          isCollapsed ? 'hidden' : 'block'
        }`}
      >
        <div
          ref={outputContainerRef}
          className={`h-full w-full ${currentTab === 'output' ? 'block' : 'hidden'}`}
        />
        <div
          ref={terminalContainerRef}
          className={`h-full w-full ${currentTab === 'terminal' ? 'block' : 'hidden'}`}
        />
      </div>
    </section>
  );
}
