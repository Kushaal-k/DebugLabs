import type {
  SupportedLanguage,
  DsaProblem,
  DsaProblemSummary,
  DsaTestCase,
  DsaRunSummary,
  DsaSubmissionResult,
} from '../types/dsa';
import { DEFAULT_DSA_PROBLEMS } from '../data/dsaScenarios';

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/+$/, '') ||
  '/api';

const DSA_API_BASE = `${SERVER_URL}/v1/dsa`;

export interface ProblemFilters {
  difficulty?: string;
  category?: string;
  search?: string;
}

/**
 * Fetches all DSA problem summaries from the backend.
 * Falls back to local problem scenarios if the backend is unreachable.
 */
export async function fetchDsaProblems(
  filters?: ProblemFilters
): Promise<DsaProblemSummary[]> {
  const query = new URLSearchParams();
  if (filters?.difficulty && filters.difficulty !== 'All') {
    query.set('difficulty', filters.difficulty);
  }
  if (filters?.category && filters.category !== 'All') {
    query.set('category', filters.category);
  }
  if (filters?.search && filters.search.trim().length > 0) {
    query.set('search', filters.search.trim());
  }

  const url = `${DSA_API_BASE}/problems${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch problems: ${res.status} ${res.statusText}`);
    }

    const data: DsaProblemSummary[] = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend unavailable, falling back to local problem scenarios:', err);
    return DEFAULT_DSA_PROBLEMS.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      category: p.category,
      tags: p.tags,
      description: p.description,
      languages: Object.keys(p.starterCode) as SupportedLanguage[],
    }));
  }
}

/**
 * Fetches full problem definition for a specific problem ID.
 */
export async function fetchDsaProblem(id: string): Promise<DsaProblem> {
  const url = `${DSA_API_BASE}/problems/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch problem "${id}": ${res.status} ${res.statusText}`);
    }

    const problem: DsaProblem = await res.json();
    return problem;
  } catch (err) {
    console.warn(`Failed to fetch problem "${id}" from backend, checking local fallback:`, err);
    const local = DEFAULT_DSA_PROBLEMS.find((p) => p.id === id);
    if (local) return local;
    throw err;
  }
}

/**
 * Runs user code against public (and optional custom) test cases via the backend execution engine.
 */
export async function runDsaTestCases(
  problemId: string,
  language: SupportedLanguage,
  code: string,
  customTestCases?: DsaTestCase[]
): Promise<DsaRunSummary> {
  const url = `${DSA_API_BASE}/problems/${encodeURIComponent(problemId)}/run`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      problemId,
      language,
      code,
      customTestCases: customTestCases && customTestCases.length > 0 ? customTestCases : undefined,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `Execution failed with status ${res.status}`);
  }

  const summary: DsaRunSummary = await res.json();
  return summary;
}

/**
 * Submits user solution for full verification against both sample and hidden test cases.
 */
export async function submitDsaSolution(
  problemId: string,
  language: SupportedLanguage,
  code: string
): Promise<DsaSubmissionResult> {
  const url = `${DSA_API_BASE}/problems/${encodeURIComponent(problemId)}/submit`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      problemId,
      language,
      code,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `Submission failed with status ${res.status}`);
  }

  const result: DsaSubmissionResult = await res.json();
  return result;
}
