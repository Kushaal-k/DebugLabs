import { useMemo } from 'react';
import {
  Tag,
  Layers,
  ChevronDown,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { DsaProblem, DsaProblemSummary } from '../../types/dsa';
import { DEFAULT_DSA_PROBLEMS } from '../../data/dsaScenarios';

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f10] text-[#ededed] overflow-y-auto custom-scrollbar select-text">
      {/* Problem Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#0f0f10] sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <h1 className="text-sm font-semibold text-[#ededed] tracking-tight truncate">
            {currentProblem.title}
          </h1>

          {/* Quick Problem Switcher */}
          <div className="relative shrink-0">
            <select
              value={currentProblem.id}
              onChange={(e) => {
                onSelectProblem(e.target.value);
              }}
              className="h-7 bg-[#19191b] hover:bg-[#232325] border border-white/[0.08] text-[#ededed] text-xs rounded-md px-2.5 pr-6 cursor-pointer appearance-none outline-none font-sans transition-colors"
            >
              {problemList.map((prob) => (
                <option key={prob.id} value={prob.id} className="bg-[#19191b]">
                  {prob.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5] absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${difficultyColor}`}
          >
            {currentProblem.difficulty}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-[#a1a1a6] bg-[#19191b] px-2 py-0.5 rounded-[4px] border border-white/[0.06]">
            <Layers className="w-3 h-3 text-[#85858b] stroke-[1.5]" />
            {currentProblem.category}
          </span>

          {currentProblem.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] text-[#85858b] bg-[#141415] px-2 py-0.5 rounded-[4px] border border-white/[0.06]"
            >
              <Tag className="w-3 h-3 stroke-[1.5]" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Problem Content */}
      <div className="p-4 space-y-6 text-xs leading-relaxed text-[#a1a1a6]">
        {/* Bug Overview */}
        {currentProblem.bugDescription && (
          <section className="bg-[#19191b] border border-white/[0.08] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#ededed]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 stroke-[1.5]" />
              <span>Bug overview</span>
            </div>
            <p className="text-[12px] text-[#d4d4d8] leading-relaxed">
              {currentProblem.bugDescription}
            </p>
          </section>
        )}

        {/* Debugging Hints */}
        {currentProblem.hints && currentProblem.hints.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-[#85858b] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Debugging hints</span>
            </h2>
            <div className="space-y-1.5">
              {currentProblem.hints.map((hint, i) => (
                <details
                  key={i}
                  className="group bg-[#19191b] border border-white/[0.08] rounded-lg p-3 text-[12px] text-[#a1a1a6]"
                >
                  <summary className="cursor-pointer font-medium text-[#ededed] select-none text-[11px] hover:text-[#4cc38a] transition-colors">
                    Hint {i + 1}
                  </summary>
                  <p className="mt-2 pl-2 border-l border-white/[0.12] text-[11px] leading-5 text-[#a1a1a6]">
                    {hint}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        <section>
          <div className="whitespace-pre-line text-[#ededed] font-sans text-[13px] leading-6">
            {currentProblem.description}
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-[#85858b]">
            Examples
          </h2>
          {currentProblem.examples.map((example) => (
            <div
              key={example.id}
              className="bg-[#19191b] border border-white/[0.08] rounded-lg p-3.5 space-y-2"
            >
              <div className="text-[12px] font-medium text-[#ededed]">
                Example {example.id}
              </div>
              <div className="space-y-1.5 font-mono text-[11px] bg-[#0f0f10] p-2.5 rounded-md border border-white/[0.04]">
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
                <code className="text-[#ededed] bg-[#19191b] px-1.5 py-0.5 rounded-[4px] border border-white/[0.06]">
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
