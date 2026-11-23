import { RotateCcw, Loader2, Play, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { SupportedLanguage } from '@debugLabs/shared';
import { LanguageSelector } from '../dsa/LanguageSelector';

interface Props {
  onBack: () => void;
  problemTitle: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onReset: () => void;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onRunTestCases: () => void;
  isDsaRunning: boolean;
  onSubmitSolution: () => void;
  isSubmitting: boolean;
}

export function EditorToolbar({
  onBack,
  problemTitle,
  difficulty,
  onReset,
  selectedLanguage,
  onSelectLanguage,
  onRunTestCases,
  isDsaRunning,
  onSubmitSolution,
  isSubmitting,
}: Props) {
  const isBusy = isDsaRunning || isSubmitting;

  const difficultyClasses = {
    Easy: 'bg-emerald-500/10 text-[#4cc38a] border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <header className="h-12 bg-[#0f0f10] border-b border-white/[0.08] px-4 flex items-center justify-between select-none shrink-0">
      {/* Left: Navigation and problem summary */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="h-8 flex items-center gap-2 text-xs text-[#a1a1a6] hover:text-[#ededed] px-2.5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
          title="Return to questions list"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>Problems</span>
        </button>

        <div className="h-4 w-px bg-white/[0.08]" />

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium text-[#ededed] tracking-tight">
            {problemTitle}
          </span>
          {difficulty && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${
                difficultyClasses[difficulty] || difficultyClasses.Easy
              }`}
            >
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={onSelectLanguage}
          disabled={isBusy}
        />

        <button
          type="button"
          onClick={onReset}
          disabled={isBusy}
          className="h-8 flex items-center gap-1.5 text-xs text-[#85858b] hover:text-[#ededed] px-2.5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
          title="Reset code to starter template"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onRunTestCases}
          disabled={isBusy}
          className="h-8 flex items-center gap-2 bg-[#232325] hover:bg-[#2b2b2e] border border-white/[0.08] text-[#ededed] font-medium text-xs px-3 rounded-md transition-colors cursor-pointer disabled:opacity-40"
          title="Run sample test cases"
        >
          {isDsaRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a1a1a6] stroke-[1.5]" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current stroke-[1.5] text-[#a1a1a6]" />
          )}
          <span>{isDsaRunning ? 'Testing…' : 'Run'}</span>
        </button>

        <button
          type="button"
          onClick={onSubmitSolution}
          disabled={isBusy}
          className="h-8 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 rounded-md transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
          title="Submit solution for grading"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
          )}
          <span>{isSubmitting ? 'Grading…' : 'Submit'}</span>
        </button>
      </div>
    </header>
  );
}
