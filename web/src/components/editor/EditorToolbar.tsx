import { Bug, Play, RotateCcw, Loader2 } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';

interface Props {
  activeFile: ProjectFile;
  isRunning: boolean;
  onRunFile: () => void;
  onReset: () => void;
}

export function EditorToolbar({
  activeFile,
  isRunning,
  onRunFile,
  onReset,
}: Props) {
  return (
    <header className="h-11 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Bug className="w-4 h-4 text-emerald-400" />
        <span>DebugLabs</span>
        <span className="text-xs font-normal text-[#8b949e]">
          / {activeFile.folder === 'root' ? '' : `${activeFile.folder}/`}
          {activeFile.name}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 text-[#c9d1d9] text-xs px-3 py-1.5 rounded cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          onClick={onRunFile}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded cursor-pointer transition shadow-sm"
          title={`Execute ${activeFile.name} in container sandbox`}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          {isRunning ? 'Running...' : `Run ${activeFile.name}`}
        </button>
      </div>
    </header>
  );
}
