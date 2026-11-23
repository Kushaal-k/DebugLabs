import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bug,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import { DEFAULT_DSA_PROBLEMS } from '../../data/dsaScenarios';
import type { DsaDifficulty, DsaProblem, DsaProblemSummary } from '../../types/dsa';

interface Props {
  problems?: (DsaProblem | DsaProblemSummary)[];
  onOpenProblem: (problem: DsaProblem | DsaProblemSummary) => void;
  isLoading?: boolean;
}

const difficultyStyles: Record<DsaDifficulty, string> = {
  Easy: 'text-emerald-400',
  Medium: 'text-amber-400',
  Hard: 'text-rose-400',
};

export function DsaDashboard({
  problems = DEFAULT_DSA_PROBLEMS,
  onOpenProblem,
  isLoading = false,
}: Props) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const topics = useMemo(
    () =>
      [...new Set(problems.map((problem) => problem.category))].sort(),
    [problems]
  );

  const filteredProblems = useMemo(() => {
    const search = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const searchableText = [
        problem.title,
        problem.category,
        ...problem.tags,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!search || searchableText.includes(search)) &&
        (difficulty === 'All' || problem.difficulty === difficulty) &&
        (topic === 'All' || problem.category === topic)
      );
    });
  }, [problems, query, difficulty, topic]);

  const activeFilterCount =
    Number(difficulty !== 'All') + Number(topic !== 'All');

  const hasSearchOrFilters =
    query.length > 0 || activeFilterCount > 0;

  const clearFilters = () => {
    setQuery('');
    setDifficulty('All');
    setTopic('All');
  };

  return (
    <div className="h-dvh overflow-y-auto bg-[#0f0f10] text-[#ededed]">
      <header className="border-b border-white/[0.08] bg-[#141415]">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-5 sm:px-8">
          <div className="flex items-center gap-2">
            <Bug
              aria-hidden="true"
              className="h-4 w-4 text-emerald-400 stroke-[1.75]"
            />

            <span className="text-[13px] font-medium tracking-tight">
              DebugLabs
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Labs
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#85858b]">
            Explore DSA questions and open a workspace to get started.
          </p>
        </div>

        <div className="mb-5 border-b border-white/[0.08]">
          <h2 className="inline-block border-b-2 border-emerald-400 px-2 pb-3 text-sm font-medium">
            DSA
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">
              Search labs by title, topic or tag
            </span>

            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#85858b]"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search labs"
              className="h-10 w-full rounded-lg border border-white/10 bg-[#141415] pl-9 pr-3 text-sm outline-none placeholder:text-[#85858b] focus-visible:border-emerald-400 focus-visible:ring-1 focus-visible:ring-emerald-400"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            aria-expanded={showFilters}
            aria-controls="dsa-lab-filters"
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-4 w-4"
            />

            Filters

            {activeFilterCount > 0 && (
              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-400">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div id="dsa-lab-filters" hidden={!showFilters}>
          <div className="mt-3 grid gap-3 rounded-lg border border-white/10 bg-[#141415] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs text-[#a1a1a6]">
              Difficulty

              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="h-10 rounded-md border border-white/10 bg-[#1e1e21] px-3 text-sm text-[#ededed] outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <option value="All">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs text-[#a1a1a6]">
              Topic

              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="h-10 rounded-md border border-white/10 bg-[#1e1e21] px-3 text-sm text-[#ededed] outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <option value="All">All topics</option>

                {topics.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex min-h-12 items-center justify-between gap-3">
          <p role="status" className="text-xs text-[#85858b]">
            {hasSearchOrFilters
              ? `${filteredProblems.length} of ${problems.length} labs`
              : `${problems.length} ${
                  problems.length === 1 ? 'lab' : 'labs'
                }`}
          </p>

          {hasSearchOrFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#a1a1a6] hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <X aria-hidden="true" className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#141415] px-6 py-16 text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-sm font-medium text-[#ededed]">Loading DSA labs...</p>
            <p className="text-xs text-[#85858b]">Fetching debugging challenges from backend</p>
          </div>
        ) : filteredProblems.length > 0 ? (
          <ul className="overflow-hidden rounded-lg border border-white/10 bg-[#141415] divide-y divide-white/[0.08]">
            {filteredProblems.map((problem) => {
              const languageCount =
                ('languages' in problem && problem.languages?.length)
                  ? problem.languages.length
                  : ('starterCode' in problem && problem.starterCode
                      ? Object.values(problem.starterCode).filter((code) => code.trim().length > 0).length
                      : 4);

              const description = (problem.description || '')
                .replace(/[`*]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

              return (
                <li key={problem.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProblem(problem)}
                    aria-label={`Open ${problem.title} workspace`}
                    className="group flex w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {problem.title}
                      </span>

                      <span className="mt-1.5 block truncate text-xs leading-5 text-[#a1a1a6]">
                        {description}
                      </span>

                      <span className="mt-2 block text-[11px] text-[#85858b]">
                        {problem.category}
                        {' · '}
                        {languageCount}
                        {' '}
                        {languageCount === 1 ? 'language' : 'languages'}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 text-xs ${
                        difficultyStyles[problem.difficulty]
                      }`}
                    >
                      {problem.difficulty}
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[#85858b] transition-colors group-hover:text-emerald-400"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#141415] px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {problems.length === 0
                ? 'No labs available'
                : 'No matching labs'}
            </p>

            <p className="mt-2 text-xs leading-6 text-[#85858b]">
              {problems.length === 0
                ? 'New labs will appear here when they are added.'
                : 'Try another search or clear your filters.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}