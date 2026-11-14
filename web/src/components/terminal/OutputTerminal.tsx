import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TerminalIcon, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Props {
  logs: string[];
  isRunning: boolean;
  failureCount: number;
  onClear: () => void;
}

export function OutputTerminal({ logs, isRunning, failureCount, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const renderedCountRef = useRef<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

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
    term.open(containerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[36m[DebugLabs Execution Engine]\x1b[0m Ready. Click "Run Verification" to test your fixes.');

    termRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    if (logs.length === 0) {
      term.clear();
      renderedCountRef.current = 0;
      return;
    }

    const newLogs = logs.slice(renderedCountRef.current);
    newLogs.forEach((line) => term.writeln(line));
    renderedCountRef.current = logs.length;
  }, [logs]);

  return (
    <section
      className={`${
        isCollapsed ? 'h-9' : 'h-56'
      } bg-[#0d1117] border-t border-[#30363d] flex flex-col transition-all`}
    >
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-xs text-[#8b949e] select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#e6edf3] font-semibold tracking-wide">
            <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>TERMINAL</span>
          </div>

          {failureCount > 0 && (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" />
              Failed ({failureCount})
            </span>
          )}

          {isRunning && (
            <span className="text-amber-400 animate-pulse">● Running in Docker sandbox...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 hover:text-white cursor-pointer"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 hover:text-white cursor-pointer"
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 p-2 overflow-hidden ${isCollapsed ? 'hidden' : 'block'}`}
      />
    </section>
  );
}