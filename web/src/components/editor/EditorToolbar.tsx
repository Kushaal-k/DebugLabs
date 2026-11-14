import { Bug, Play, RotateCcw, Loader2 } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';
import type { EngineMode } from '../../services/executionService';

interface Props {
  activeFile: ProjectFile;
  engineMode: EngineMode;
  isRunning: boolean;
  onEngineModeChange: (mode: EngineMode) => void;
  onRunTests: () => void;
  onReset: () => void;
}

export function EditorToolbar({
  activeFile,
  engineMode,
  isRunning,
  onEngineModeChange,
  onRunTests,
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
        <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#c9d1d9]">
          <span className="text-[#8b949e]">Engine:</span>
          <select
            value={engineMode}
            onChange={(e) => onEngineModeChange(e.target.value as EngineMode)}
            disabled={isRunning}
            className="bg-transparent text-[#e6edf3] focus:outline-none cursor-pointer"
          >
            <option value="auto" className="bg-[#161b22]">Auto (Direct / Queue)</option>
            <option value="direct" className="bg-[#161b22]">Direct Sandbox</option>
            <option value="queue" className="bg-[#161b22]">Worker Queue</option>
          </select>
        </div>

        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 text-[#c9d1d9] text-xs px-3 py-1.5 rounded cursor-pointer transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          onClick={onRunTests}
          disabled={isRunning}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded cursor-pointer transition"
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isRunning ? 'Executing...' : 'Run Verification'}
        </button>
      </div>
    </header>
  );
}