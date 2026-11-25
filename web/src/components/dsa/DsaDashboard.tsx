import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bug,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import { ThemeToggle } from '../common/theme';
import { LabShell } from '../common/LabShell';
import { DEFAULT_DSA_PROBLEMS } from '../../data/dsaScenarios';
import type { DsaDifficulty, DsaProblem, DsaProblemSummary } from '../../types/dsa';

interface Props {
  problems?: (DsaProblem | DsaProblemSummary)[];
  onOpenProblem: (problem: DsaProblem | DsaProblemSummary) => void;
  isLoading?: boolean;
}

const difficultyStyles: Record<DsaDifficulty, string> = {
  Easy: 'text-lab-positive',
  Medium: 'text-lab-warning',
  Hard: 'text-lab-danger',
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
    <LabShell>
      <div className="relative z-10 h-full overflow-y-auto">
        <header className="sticky top-0 z-20 px-4 pt-3 sm:px-6">
          <div className="glass mx-auto flex h-12 max-w-3xl items-center justify-between rounded-full px-5">
            <div className="flex items-center gap-2">
              <Bug
                aria-hidden="true"
                className="h-4 w-4 stroke-[1.75] text-lab-accent"
              />
              <span className="text-[13px] font-medium tracking-tight">
                DebugLabs
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
          <div className="mb-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-muted">
              DSA
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
              Labs
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-lab-intro">
              Explore questions and open a workspace to get started.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">
                Search labs by title, topic or tag
              </span>

              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-lab-muted"
              />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search labs"
                className="glass h-11 w-full rounded-full pl-11 pr-4 text-sm outline-none placeholder:text-lab-faint focus-visible:border-lab-positive/50 focus-visible:ring-2 focus-visible:ring-lab-positive/30"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              aria-expanded={showFilters}
              aria-controls="dsa-lab-filters"
              className={`glass flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-xs transition-colors hover:bg-lab-line/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-positive ${
                showFilters ? 'bg-lab-line/[0.08]' : ''
              }`}
            >
              <SlidersHorizontal
                aria-hidden="true"
                className="h-4 w-4"
              />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-lab-accent">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div id="dsa-lab-filters" hidden={!showFilters}>
            <div className="glass mt-3 grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs text-lab-secondary">
                Difficulty
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="glass-inset h-10 rounded-xl px-3 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-positive"
                >
                  <option value="All" className="bg-lab-menu text-lab-ink">All difficulties</option>
                  <option value="Easy" className="bg-lab-menu text-lab-ink">Easy</option>
                  <option value="Medium" className="bg-lab-menu text-lab-ink">Medium</option>
                  <option value="Hard" className="bg-lab-menu text-lab-ink">Hard</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs text-lab-secondary">
                Topic
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="glass-inset h-10 rounded-xl px-3 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-positive"
                >
                  <option value="All" className="bg-lab-menu text-lab-ink">All topics</option>
                  {topics.map((item) => (
                    <option key={item} value={item} className="bg-lab-menu text-lab-ink">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex min-h-12 items-center justify-between gap-3">
            <p role="status" className="text-xs text-lab-muted">
              {isLoading
                ? 'Loading labs'
                : hasSearchOrFilters
                  ? `${filteredProblems.length} of ${problems.length} labs`
                  : `${problems.length} ${
                      problems.length === 1 ? 'lab' : 'labs'
                    }`}
            </p>

            {hasSearchOrFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs text-lab-secondary hover:text-lab-ink focus-visible:outline-2 focus-visible:outline-lab-positive"
              >
                <X aria-hidden="true" className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="glass flex flex-col items-center justify-center space-y-3 rounded-2xl px-6 py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-lab-accent" />
              <p className="text-sm font-medium text-lab-ink">Loading labs</p>
              <p className="text-xs text-lab-muted">Fetching questions</p>
            </div>
          ) : filteredProblems.length > 0 ? (
            <ul className="space-y-2.5">
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
                      className="glass glass-interactive group flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-positive sm:px-5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {problem.title}
                        </span>
                        <span className="mt-1 block truncate text-xs leading-5 text-lab-secondary">
                          {description}
                        </span>
                        <span className="mt-2 block text-[11px] text-lab-muted">
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
                        className="h-4 w-4 shrink-0 text-lab-faint transition-transform group-hover:translate-x-0.5 group-hover:text-lab-accent"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="glass rounded-2xl px-6 py-14 text-center">
              <p className="text-sm font-medium">
                {problems.length === 0
                  ? 'No labs available'
                  : 'No matching labs'}
              </p>
              <p className="mt-2 text-xs leading-6 text-lab-muted">
                {problems.length === 0
                  ? 'New labs will appear here when they are added.'
                  : 'Try another search or clear your filters.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </LabShell>
  );
}