import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
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

  const currentTab = controlledTab ?? internalTab;

  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  const outputTermRef = useRef<Terminal | null>(null);
  const terminalTermRef = useRef<Terminal | null>(null);

  const outputFitRef = useRef<FitAddon | null>(null);
  const terminalFitRef = useRef<FitAddon | null>(null);

  const renderedCountRef = useRef<number>(0);

  const setTab = (tab: BottomPanelTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Initialize Output Xterm
  useEffect(() => {
    if (!outputContainerRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: false,
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(outputContainerRef.current);
    fitAddon.fit();

    term.writeln(
      '\x1b[36m[DebugLabs Output]\x1b[0m Ready. Click "Run" to execute the current file in the container.'
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
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[36m[DebugLabs Interactive Terminal]\x1b[0m Container sandbox session.');
    term.writeln('\x1b[90mType "help" for a list of available commands.\x1b[0m');
    term.write('\r\n\x1b[32mdebuglabs@container\x1b[0m:\x1b[34m/tmp/workspace\x1b[0m$ ');

    let currentInput = '';
    term.onData((data) => {
      if (data === '\r') {
        term.write('\r\n');
        const cmd = currentInput.trim();
        if (cmd === 'clear') {
          term.clear();
        } else if (cmd === 'help') {
          term.writeln('Commands: help, clear, ls, pwd, whoami, node -v, python3 --version');
        } else if (cmd === 'ls') {
          term.writeln('server/  web/  execution-engine/  shared/  PROBLEM.md');
        } else if (cmd === 'pwd') {
          term.writeln('/tmp/workspace');
        } else if (cmd === 'whoami') {
          term.writeln('developer (uid: 1000)');
        } else if (cmd === 'node -v') {
          term.writeln('v24.0.0');
        } else if (cmd === 'python3 --version') {
          term.writeln('Python 3.12.0');
        } else if (cmd.length > 0) {
          term.writeln(`bash: ${cmd}: command executed`);
        }
        currentInput = '';
        term.write('\x1b[32mdebuglabs@container\x1b[0m:\x1b[34m/tmp/workspace\x1b[0m$ ');
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

  // Update Output logs
  useEffect(() => {
    const term = outputTermRef.current;
    if (!term) return;

    if (logs.length === 0) {
      term.clear();
      term.writeln(
        '\x1b[36m[DebugLabs Output]\x1b[0m Ready. Click "Run" to execute the current file in the container.'
      );
      renderedCountRef.current = 0;
      return;
    }

    const newLogs = logs.slice(renderedCountRef.current);
    newLogs.forEach((line) => term.writeln(line));
    renderedCountRef.current = logs.length;
  }, [logs]);

  // Fit addons when switching tabs
  useEffect(() => {
    if (isCollapsed) return;
    const timer = setTimeout(() => {
      if (currentTab === 'output') {
        outputFitRef.current?.fit();
      } else {
        terminalFitRef.current?.fit();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentTab, isCollapsed]);

  const handleClear = () => {
    if (currentTab === 'output') {
      onClear();
      outputTermRef.current?.clear();
      outputTermRef.current?.writeln('\x1b[36m[DebugLabs Output]\x1b[0m Output cleared.');
      renderedCountRef.current = 0;
    } else {
      terminalTermRef.current?.clear();
      terminalTermRef.current?.write(
        '\x1b[32mdebuglabs@container\x1b[0m:\x1b[34m/tmp/workspace\x1b[0m$ '
      );
    }
  };

  return (
    <section
      className={`${
        isCollapsed ? 'h-9' : 'h-56'
      } bg-[#0d1117] border-t border-[#30363d] flex flex-col transition-all`}
    >
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-xs text-[#8b949e] select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab('output')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition ${
                currentTab === 'output'
                  ? 'text-[#e6edf3] bg-[#21262d] border-b-2 border-sky-400'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>OUTPUT</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('terminal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition ${
                currentTab === 'terminal'
                  ? 'text-[#e6edf3] bg-[#21262d] border-b-2 border-emerald-400'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>TERMINAL</span>
            </button>
          </div>

          {failureCount > 0 && (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" />
              Failed ({failureCount})
            </span>
          )}

          {isRunning && (
            <span className="text-amber-400 animate-pulse">● Running in container sandbox...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-1 hover:text-white cursor-pointer"
            title={`Clear ${currentTab}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 hover:text-white cursor-pointer"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`flex-1 p-2 overflow-hidden relative ${isCollapsed ? 'hidden' : 'block'}`}>
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
