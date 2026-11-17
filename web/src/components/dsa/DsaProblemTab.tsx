import { useMemo } from 'react';
import { BookOpen, Tag, Layers, ChevronDown } from 'lucide-react';
import type { DsaProblem } from '../../types/dsa';
import { DEFAULT_DSA_PROBLEMS } from '../../data/dsaScenarios';

interface Props {
  currentProblem: DsaProblem;
  onSelectProblem: (problem: DsaProblem) => void;
}

export function DsaProblemTab({ currentProblem, onSelectProblem }: Props) {
  const difficultyColor = useMemo(() => {
    switch (currentProblem.difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  }, [currentProblem.difficulty]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f10] text-[#ededed] overflow-y-auto custom-scrollbar select-text">
      {/* Problem Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#141415]/60 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-[#85858b]">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
            <span>DSA Question</span>
          </div>

          {/* Quick Problem Switcher */}
          <div className="relative">
            <select
              value={currentProblem.id}
              onChange={(e) => {
                const found = DEFAULT_DSA_PROBLEMS.find((p) => p.id === e.target.value);
                if (found) onSelectProblem(found);
              }}
              className="bg-[#1e1e21] border border-white/[0.08] hover:border-white/[0.15] text-[#ededed] text-xs rounded px-2.5 py-1 pr-6 cursor-pointer appearance-none outline-none font-mono"
            >
              {DEFAULT_DSA_PROBLEMS.map((prob) => (
                <option key={prob.id} value={prob.id} className="bg-[#18181b]">
                  {prob.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#85858b] absolute right-1.5 top-1.5 pointer-events-none" />
          </div>
        </div>

        <h1 className="text-base font-semibold text-[#ededed] mb-2 tracking-tight">
          {currentProblem.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${difficultyColor}`}
          >
            {currentProblem.difficulty}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-[#a1a1a6] bg-[#1a1a1d] px-2 py-0.5 rounded border border-white/[0.06]">
            <Layers className="w-3 h-3 text-[#85858b]" />
            {currentProblem.category}
          </span>

          {currentProblem.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] text-[#85858b] bg-[#141415] px-2 py-0.5 rounded border border-white/[0.04]"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Problem Content */}
      <div className="p-4 space-y-6 text-xs leading-relaxed text-[#c4c4c8]">
        {/* Description */}
        <section>
          <div className="whitespace-pre-line text-[#d4d4d8] font-sans text-[13px] leading-6">
            {currentProblem.description}
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#85858b]">
            Examples
          </h2>
          {currentProblem.examples.map((example) => (
            <div
              key={example.id}
              className="bg-[#141415] border border-white/[0.06] rounded-[6px] p-3 space-y-2"
            >
              <div className="text-[12px] font-medium text-[#ededed]">
                Example {example.id}:
              </div>
              <div className="space-y-1 font-mono text-[11px] bg-[#0d0d0e] p-2 rounded border border-white/[0.04]">
                <div>
                  <span className="text-[#85858b]">Input: </span>
                  <span className="text-emerald-400">{example.input}</span>
                </div>
                <div>
                  <span className="text-[#85858b]">Output: </span>
                  <span className="text-sky-400">{example.output}</span>
                </div>
                {example.explanation && (
                  <div className="text-[#a1a1a6] text-[11px] pt-1 border-t border-white/[0.04] font-sans">
                    <span className="text-[#85858b] font-mono">Explanation: </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Constraints */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#85858b]">
            Constraints
          </h2>
          <ul className="space-y-1 font-mono text-[11px] text-[#a1a1a6] list-disc list-inside">
            {currentProblem.constraints.map((c, i) => (
              <li key={i} className="leading-5">
                <code className="text-[#ededed] bg-[#1a1a1d] px-1 py-0.5 rounded">
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
