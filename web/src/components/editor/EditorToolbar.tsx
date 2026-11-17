import { Bug, Play, RotateCcw, Loader2, FlaskConical } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';
import type { SupportedLanguage } from '@debugLabs/shared';
import { LanguageSelector } from '../dsa/LanguageSelector';

interface Props {
  activeFile: ProjectFile;
  isRunning: boolean;
  onRunFile: () => void;
  onReset: () => void;
  selectedLanguage?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
  onRunTestCases?: () => void;
  isDsaRunning?: boolean;
}

export function EditorToolbar({
  activeFile,
  isRunning,
  onRunFile,
  onReset,
  selectedLanguage = 'javascript',
  onSelectLanguage,
  onRunTestCases,
  isDsaRunning = false,
}: Props) {
  const breadcrumbPath =
    activeFile.folder === 'root'
      ? activeFile.name
      : `${activeFile.folder}/${activeFile.name}`;

  return (
    <header className="h-11 bg-[#141415] border-b border-white/[0.08] px-4 flex items-center justify-between select-none shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
          <span className="text-[13px] font-medium text-[#ededed] tracking-tight">
            DebugLabs
          </span>
        </div>
        <span className="text-xs text-[#85858b] font-mono hidden sm:inline">
          / {breadcrumbPath}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Language Selector */}
        {onSelectLanguage && (
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={onSelectLanguage}
            disabled={isRunning || isDsaRunning}
          />
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={isRunning || isDsaRunning}
          className="flex items-center gap-1.5 bg-[#1e1e21] hover:bg-[#26262a] border border-white/[0.08] disabled:opacity-40 text-[#a1a1a6] hover:text-[#ededed] text-xs px-2.5 py-1.5 rounded-[6px] cursor-pointer transition-colors duration-150"
          title="Reset workspace files"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span className="hidden md:inline">Reset</span>
        </button>

        {/* Run Test Cases */}
        {onRunTestCases && (
          <button
            type="button"
            onClick={onRunTestCases}
            disabled={isRunning || isDsaRunning}
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 disabled:opacity-50 font-medium text-xs px-3 py-1.5 rounded-[6px] cursor-pointer transition-colors duration-150"
            title="Run solution against DSA test cases"
          >
            {isDsaRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2]" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 stroke-[1.75]" />
            )}
            <span>{isDsaRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>
        )}

        {/* Run File */}
        <button
          type="button"
          onClick={onRunFile}
          disabled={isRunning || isDsaRunning}
          className="flex items-center gap-1.5 bg-[#ededed] hover:bg-white disabled:opacity-50 text-[#141415] font-medium text-xs px-3 py-1.5 rounded-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer transition-colors duration-150"
          title={`Execute ${activeFile.name}`}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2]" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-[#141415] stroke-[1.5]" />
          )}
          <span>{isRunning ? 'Running…' : `Run ${activeFile.name}`}</span>
        </button>
      </div>
    </header>
  );
}
