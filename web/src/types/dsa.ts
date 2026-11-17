import type { SupportedLanguage } from '@debugLabs/shared';

export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface DsaExample {
  id: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface DsaTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isCustom?: boolean;
}

export interface DsaTestCaseResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTimeMs: number;
  errorMessage?: string;
}

export interface DsaRunSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimeMs: number;
  results: DsaTestCaseResult[];
  status: 'passed' | 'failed' | 'error';
}

export interface DsaProblem {
  id: string;
  title: string;
  difficulty: DsaDifficulty;
  category: string;
  tags: string[];
  description: string;
  examples: DsaExample[];
  constraints: string[];
  starterCode: Record<SupportedLanguage, string>;
  testCases: DsaTestCase[];
}

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  extension: string;
  version: string;
  monacoLanguage: string;
}
