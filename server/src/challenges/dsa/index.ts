import type { DsaProblem, DsaProblemSummary } from "@debugLabs/shared";
import { DSA_PROBLEMS } from "./problems/index.js";

export * from "./problems/index.js";

/**
 * Returns a list of problem summaries for list/dashboard view.
 */
export function getDsaProblemSummaries(filters?: {
  difficulty?: string;
  category?: string;
  search?: string;
}): DsaProblemSummary[] {
  let list = DSA_PROBLEMS;

  if (filters?.difficulty) {
    const diff = filters.difficulty.toLowerCase();
    list = list.filter((p) => p.difficulty.toLowerCase() === diff);
  }

  if (filters?.category) {
    const cat = filters.category.toLowerCase();
    list = list.filter((p) => p.category.toLowerCase().includes(cat));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }

  return list.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    tags: p.tags,
  }));
}

/**
 * Returns public problem details for the client.
 * Strip `hiddenTestCases` so learners cannot inspect them in network tab.
 */
export function getDsaProblemForClient(id: string): DsaProblem | null {
  const problem = DSA_PROBLEMS.find((p) => p.id === id);
  if (!problem) return null;

  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    category: problem.category,
    tags: problem.tags,
    description: problem.description,
    examples: problem.examples,
    constraints: problem.constraints,
    starterCode: problem.starterCode,
    testCases: problem.testCases,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  };
}

/**
 * Returns the full problem definition including hidden test cases for grader verification.
 */
export function getDsaProblemWithHidden(id: string): DsaProblem | null {
  return DSA_PROBLEMS.find((p) => p.id === id) || null;
}
