import { RotateCcw, Loader2, Play, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { SupportedLanguage } from '@debugLabs/shared';
import { ThemeToggle } from '../common/theme';
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
    Easy: 'bg-emerald-500/10 text-lab-success border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-lab-warning border-amber-500/20',
    Hard: 'bg-rose-500/10 text-lab-danger border-rose-500/20',
  };

  return (
    <header className="glass relative z-30 flex h-12 shrink-0 items-center justify-between rounded-full px-4 select-none">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs text-lab-secondary transition-colors hover:bg-lab-line/[0.08] hover:text-lab-ink disabled:opacity-40"
          title="Return to questions list"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
          <span>Labs</span>
        </button>

        <div className="h-4 w-px bg-lab-line/10" />

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium tracking-tight text-lab-ink">
            {problemTitle}
          </span>
          {difficulty && (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                difficultyClasses[difficulty] || difficultyClasses.Easy
              }`}
            >
              {difficulty}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={onSelectLanguage}
          disabled={isBusy}
        />

        <button
          type="button"
          onClick={onReset}
          disabled={isBusy}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs text-lab-muted transition-colors hover:bg-lab-line/[0.08] hover:text-lab-ink disabled:opacity-40"
          title="Reset code to starter template"
        >
          <RotateCcw className="h-3.5 w-3.5 stroke-[1.75]" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onRunTestCases}
          disabled={isBusy}
          className="glass-inset flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-lab-ink transition-colors hover:bg-lab-line/[0.08] disabled:opacity-40"
          title="Run sample test cases"
        >
          {isDsaRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.75] text-lab-secondary" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current stroke-[1.75] text-lab-detail" />
          )}
          <span>{isDsaRunning ? 'Testing…' : 'Run'}</span>
        </button>

        <button
          type="button"
          onClick={onSubmitSolution}
          disabled={isBusy}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400 px-3.5 text-xs font-medium text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.28)] transition-colors hover:bg-emerald-300 disabled:opacity-40"
          title="Submit solution for grading"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.75]" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.75]" />
          )}
          <span>{isSubmitting ? 'Grading…' : 'Submit'}</span>
        </button>
      </div>
    </header>
  );
}
