import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tag,
  Layers,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { DsaProblem, DsaProblemSummary } from '../../types/dsa';
import { DEFAULT_DSA_PROBLEMS } from '../../data/dsaScenarios';
import { MarkdownContent } from '../common/MarkdownContent';

interface Props {
  currentProblem: DsaProblem;
  problems?: (DsaProblem | DsaProblemSummary)[];
  onSelectProblem: (problemId: string) => void;
}

export function DsaProblemTab({
  currentProblem,
  problems = DEFAULT_DSA_PROBLEMS,
  onSelectProblem,
}: Props) {
  const difficultyColor = useMemo(() => {
    switch (currentProblem.difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-lab-success border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-lab-warning border-amber-500/20';
      case 'Hard':
        return 'bg-rose-500/10 text-lab-danger border-rose-500/20';
    }
  }, [currentProblem.difficulty]);

  const problemList = problems && problems.length > 0 ? problems : DEFAULT_DSA_PROBLEMS;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-full flex-1 select-text flex-col overflow-hidden text-lab-ink">
      <div className="z-20 shrink-0 border-b border-lab-line/[0.08] bg-lab-recess/40 p-4">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h1 className="truncate text-sm font-semibold tracking-tight text-lab-ink">
            {currentProblem.title}
          </h1>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((previous) => !previous)}
              className="glass-inset flex h-7 max-w-40 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs text-lab-ink transition-colors hover:bg-lab-line/[0.08]"
            >
              <span className="truncate">{currentProblem.title}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 stroke-[1.5] text-lab-muted transition-transform duration-150 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div
                role="listbox"
                aria-label="Problems"
                className="glass-dropdown absolute right-0 z-50 mt-1.5 w-56 rounded-2xl py-1.5"
              >
                <div className="mb-1 border-b border-lab-line/[0.08] px-3 py-1 text-[11px] font-medium tracking-wide text-lab-muted">
                  Problems
                </div>
                <div className="custom-scrollbar max-h-64 space-y-0.5 overflow-y-auto p-1">
                  {problemList.map((problem) => {
                    const isSelected = problem.id === currentProblem.id;

                    return (
                      <button
                        key={problem.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectProblem(problem.id);
                          setIsOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-lab-line/[0.12] font-medium text-lab-ink'
                            : 'text-lab-secondary hover:bg-lab-line/[0.08] hover:text-lab-ink'
                        }`}
                      >
                        <span className="truncate">{problem.title}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 stroke-[1.5] text-lab-positive" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${difficultyColor}`}
          >
            {currentProblem.difficulty}
          </span>

          <span className="flex items-center gap-1 rounded-full border border-lab-line/[0.08] bg-lab-line/[0.04] px-2 py-0.5 text-[11px] text-lab-secondary">
            <Layers className="h-3 w-3 stroke-[1.5] text-lab-muted" />
            {currentProblem.category}
          </span>

          {currentProblem.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-lab-line/[0.06] bg-lab-line/[0.03] px-2 py-0.5 text-[11px] text-lab-muted"
            >
              <Tag className="w-3 h-3 stroke-[1.5]" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4 text-xs leading-relaxed text-lab-secondary">
        {/* Description parsed with Markdown */}
        <section>
          <MarkdownContent content={currentProblem.description} />
        </section>

        {/* Examples */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-lab-muted">
            Examples
          </h2>
          {currentProblem.examples.map((example) => (
            <div
              key={example.id}
              className="glass-inset space-y-2 rounded-2xl p-3.5"
            >
              <div className="text-[12px] font-medium text-lab-ink">
                Example {example.id}
              </div>
              <div className="space-y-1.5 rounded-xl border border-lab-line/[0.06] bg-lab-recess/30 p-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-lab-muted">Input </span>
                  <span className="text-lab-ink">{example.input}</span>
                </div>
                <div>
                  <span className="text-lab-muted">Output </span>
                  <span className="text-lab-ink">{example.output}</span>
                </div>
                {example.explanation && (
                  <div className="text-lab-secondary text-[11px] pt-1.5 border-t border-lab-line/[0.06] font-sans">
                    <span className="text-lab-muted font-mono">Explanation </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Constraints */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-lab-muted">
            Constraints
          </h2>
          <ul className="space-y-1.5 font-mono text-[11px] text-lab-secondary list-disc list-inside">
            {currentProblem.constraints.map((c, i) => (
              <li key={i} className="leading-5">
                <code className="rounded-md border border-lab-line/[0.08] bg-lab-line/[0.05] px-1.5 py-0.5 text-lab-ink">
                  {c}
                </code>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
