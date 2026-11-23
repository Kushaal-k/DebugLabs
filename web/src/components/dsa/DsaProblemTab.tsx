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
        return 'bg-emerald-500/10 text-[#4cc38a] border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
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
    <div className="flex h-full flex-1 select-text flex-col overflow-hidden text-[#ededed]">
      <div className="z-20 shrink-0 border-b border-white/[0.08] bg-black/40 p-4">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h1 className="truncate text-sm font-semibold tracking-tight text-[#ededed]">
            {currentProblem.title}
          </h1>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((previous) => !previous)}
              className="glass-inset flex h-7 max-w-40 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs text-[#ededed] transition-colors hover:bg-white/[0.08]"
            >
              <span className="truncate">{currentProblem.title}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 stroke-[1.5] text-[#85858b] transition-transform duration-150 ${
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
                <div className="mb-1 border-b border-white/[0.08] px-3 py-1 text-[11px] font-medium tracking-wide text-[#85858b]">
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
                            ? 'bg-white/[0.12] font-medium text-[#ededed]'
                            : 'text-[#a1a1a6] hover:bg-white/[0.08] hover:text-[#ededed]'
                        }`}
                      >
                        <span className="truncate">{problem.title}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 stroke-[1.5] text-emerald-400" />
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

          <span className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#a1a1a6]">
            <Layers className="h-3 w-3 stroke-[1.5] text-[#85858b]" />
            {currentProblem.category}
          </span>

          {currentProblem.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-[#85858b]"
            >
              <Tag className="w-3 h-3 stroke-[1.5]" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4 text-xs leading-relaxed text-[#a1a1a6]">
        {/* Description parsed with Markdown */}
        <section>
          <MarkdownContent content={currentProblem.description} />
        </section>

        {/* Examples */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-[#85858b]">
            Examples
          </h2>
          {currentProblem.examples.map((example) => (
            <div
              key={example.id}
              className="glass-inset space-y-2 rounded-2xl p-3.5"
            >
              <div className="text-[12px] font-medium text-[#ededed]">
                Example {example.id}
              </div>
              <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-black/30 p-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-[#85858b]">Input </span>
                  <span className="text-[#ededed]">{example.input}</span>
                </div>
                <div>
                  <span className="text-[#85858b]">Output </span>
                  <span className="text-[#ededed]">{example.output}</span>
                </div>
                {example.explanation && (
                  <div className="text-[#a1a1a6] text-[11px] pt-1.5 border-t border-white/[0.06] font-sans">
                    <span className="text-[#85858b] font-mono">Explanation </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Constraints */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-[#85858b]">
            Constraints
          </h2>
          <ul className="space-y-1.5 font-mono text-[11px] text-[#a1a1a6] list-disc list-inside">
            {currentProblem.constraints.map((c, i) => (
              <li key={i} className="leading-5">
                <code className="rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[#ededed]">
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
