import { useState, useCallback, useEffect } from 'react';
import { DsaDashboard } from './components/dsa/DsaDashboard';
import { DEFAULT_DSA_PROBLEMS } from './data/dsaScenarios';
import type { ProjectFile } from './types/workspace';
import type {
  DsaProblem,
  DsaProblemSummary,
  DsaTestCase,
  DsaRunSummary,
  DsaSubmissionResult,
} from './types/dsa';
import type { SupportedLanguage } from '@debugLabs/shared';
import { CodeEditor } from './components/editor/CodeEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import {
  OutputTerminal,
  type BottomPanelTab,
} from './components/terminal/OutputTerminal';
import { DsaProblemTab } from './components/dsa/DsaProblemTab';
import {
  fetchDsaProblems,
  fetchDsaProblem,
  runDsaTestCases,
  submitDsaSolution,
} from './services/dsaService';

const FILE_NAMES: Record<SupportedLanguage, string> = {
  javascript: 'solution.js',
  python: 'solution.py',
  cpp: 'solution.cpp',
  java: 'Solution.java',
  c: 'solution.c',
  csharp: 'Solution.cs',
};

export default function App() {
  const [showDashboard, setShowDashboard] = useState(true);

  const [currentProblem, setCurrentProblem] = useState<DsaProblem>(
    DEFAULT_DSA_PROBLEMS[0]
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('javascript');

  const [files, setFiles] = useState<ProjectFile[]>([
    {
      id: 'dsa-solution',
      name: FILE_NAMES['javascript'],
      folder: 'root',
      language: 'javascript',
      content: DEFAULT_DSA_PROBLEMS[0].starterCode['javascript'] || '',
    },
  ]);

  const [bottomTab, setBottomTab] =
    useState<BottomPanelTab>('testcases');

  const [logs, setLogs] = useState<string[]>([]);
  const [failureCount, setFailureCount] = useState<number>(0);

  const [problems, setProblems] = useState<DsaProblemSummary[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState<boolean>(true);

  const [testCases, setTestCases] = useState<DsaTestCase[]>(
    DEFAULT_DSA_PROBLEMS[0].testCases
  );

  const [dsaRunSummary, setDsaRunSummary] =
    useState<DsaRunSummary | null>(null);

  const [dsaSubmissionResult, setDsaSubmissionResult] =
    useState<DsaSubmissionResult | null>(null);

  const [isDsaRunning, setIsDsaRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch problems list from backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProblems() {
      setIsLoadingProblems(true);
      try {
        const list = await fetchDsaProblems();
        if (!isMounted) return;
        if (list && list.length > 0) {
          setProblems(list);
          const firstProblem = await fetchDsaProblem(list[0].id);
          if (isMounted && firstProblem) {
            setCurrentProblem(firstProblem);
            setTestCases(firstProblem.testCases);
            setFiles([
              {
                id: 'dsa-solution',
                name: FILE_NAMES[selectedLanguage] || 'solution.js',
                folder: 'root',
                language: selectedLanguage,
                content:
                  firstProblem.starterCode[selectedLanguage] || '',
              },
            ]);
          }
        }
      } catch (err) {
        console.warn('Could not load problems from backend on initial mount:', err);
      } finally {
        if (isMounted) setIsLoadingProblems(false);
      }
    }
    loadProblems();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguage]);

  const activeFile = files[0];

  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue === undefined) {
      return;
    }

    setFiles((previous) =>
      previous.map((file) =>
        file.id === 'dsa-solution'
          ? { ...file, content: newValue }
          : file
      )
    );
  };

  const handleReset = () => {
    setFiles([
      {
        id: 'dsa-solution',
        name: FILE_NAMES[selectedLanguage] || 'solution.js',
        folder: 'root',
        language: selectedLanguage,
        content: currentProblem.starterCode[selectedLanguage] || '',
      },
    ]);
    setTestCases(currentProblem.testCases);
    setDsaRunSummary(null);
    setDsaSubmissionResult(null);
    setFailureCount(0);

    setLogs((previous) => [
      ...previous,
      '\x1b[90mWorkspace and test cases restored to initial state\x1b[0m',
    ]);
  };

  const handleSelectLanguage = (newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage);

    setFiles([
      {
        id: 'dsa-solution',
        name: FILE_NAMES[newLanguage] || 'solution.js',
        folder: 'root',
        language: newLanguage,
        content: currentProblem.starterCode[newLanguage] || '',
      },
    ]);

    setLogs((previous) => [
      ...previous,
      `\x1b[36m[Language]\x1b[0m Switched active DSA environment to ${newLanguage.toUpperCase()}`,
    ]);
  };

  const handleSelectProblem = async (problemId: string) => {
    try {
      const problem = await fetchDsaProblem(problemId);
      setCurrentProblem(problem);
      setTestCases(problem.testCases);
      setDsaRunSummary(null);
      setDsaSubmissionResult(null);

      setFiles([
        {
          id: 'dsa-solution',
          name: FILE_NAMES[selectedLanguage] || 'solution.js',
          folder: 'root',
          language: selectedLanguage,
          content: problem.starterCode[selectedLanguage] || '',
        },
      ]);

      setLogs((previous) => [
        ...previous,
        `\x1b[36m[DSA Lab]\x1b[0m Loaded "${problem.title}" (${problem.difficulty})`,
      ]);
    } catch (err: any) {
      setLogs((previous) => [
        ...previous,
        `\x1b[31m[DSA Error]\x1b[0m Failed to load problem: ${err.message || String(err)}\x1b[0m`,
      ]);
    }
  };

  const handleUpdateTestCase = (updated: DsaTestCase) => {
    setTestCases((previous) =>
      previous.map((testCase) =>
        testCase.id === updated.id ? updated : testCase
      )
    );
  };

  const handleAddTestCase = () => {
    const newCase: DsaTestCase = {
      id: `custom-tc-${Date.now()}`,
      name: `Case ${testCases.length + 1}`,
      input: '',
      expectedOutput: '',
      isCustom: true,
    };

    setTestCases((previous) => [...previous, newCase]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((previous) =>
      previous.filter((testCase) => testCase.id !== id)
    );
  };

  const handleRunTestCases = useCallback(async () => {
    const solutionFile = files[0];

    if (!solutionFile) {
      return;
    }

    setIsDsaRunning(true);
    setDsaSubmissionResult(null);
    setBottomTab('results');

    setLogs((previous) => [
      ...previous,
      '',
      `\x1b[36m→ Evaluating ${testCases.length} test cases for ${currentProblem.title} (${selectedLanguage})...\x1b[0m`,
    ]);

    try {
      const summary = await runDsaTestCases(
        currentProblem.id,
        selectedLanguage,
        solutionFile.content,
        testCases
      );

      setDsaRunSummary(summary);

      const verdict =
        summary.verdict ||
        (summary.status === 'passed' ? 'Accepted' : 'Wrong Answer');

      if (summary.status === 'passed') {
        setLogs((previous) => [
          ...previous,
          `\x1b[32m✓ ${verdict}: All ${summary.total} test cases passed!\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
        ]);
      } else {
        setLogs((previous) => [
          ...previous,
          `\x1b[31m✗ ${verdict}: ${summary.passed}/${summary.total} test cases passed. ${summary.failed} failed.\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error evaluating test cases';

      setLogs((previous) => [
        ...previous,
        `\x1b[31mTest evaluation error: ${message}\x1b[0m`,
      ]);
    } finally {
      setIsDsaRunning(false);
    }
  }, [
    currentProblem.id,
    currentProblem.title,
    files,
    selectedLanguage,
    testCases,
  ]);

  const handleSubmitSolution = useCallback(async () => {
    const solutionFile = files[0];

    if (!solutionFile) {
      return;
    }

    setIsSubmitting(true);
    setDsaRunSummary(null);
    setBottomTab('results');

    setLogs((previous) => [
      ...previous,
      '',
      `\x1b[35m→ Submitting solution for ${currentProblem.title} (${selectedLanguage})...\x1b[0m`,
      `\x1b[90mRunning all test cases including hidden grading tests...\x1b[0m`,
    ]);

    try {
      const result = await submitDsaSolution(
        currentProblem.id,
        selectedLanguage,
        solutionFile.content
      );

      setDsaSubmissionResult(result);

      if (result.status === 'Accepted') {
        setLogs((previous) => [
          ...previous,
          `\x1b[32m🎉 Accepted! All ${result.passedCount}/${result.totalCount} test cases passed!\x1b[0m \x1b[90m(${result.executionTimeMs}ms)\x1b[0m`,
        ]);
      } else {
        setLogs((previous) => [
          ...previous,
          `\x1b[31m✗ ${result.status}: ${result.passedCount}/${result.totalCount} test cases passed.\x1b[0m \x1b[90m(${result.executionTimeMs}ms)\x1b[0m`,
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error submitting solution';

      setLogs((previous) => [
        ...previous,
        `\x1b[31mSubmission error: ${message}\x1b[0m`,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentProblem.id,
    currentProblem.title,
    files,
    selectedLanguage,
  ]);

  if (showDashboard) {
    return (
      <DsaDashboard
        problems={problems}
        isLoading={isLoadingProblems}
        onOpenProblem={(problem) => {
          if (problem.id !== currentProblem.id) {
            const solution = files[0];

            const hasEdits =
              solution &&
              solution.content !==
                currentProblem.starterCode[selectedLanguage];

            if (
              hasEdits &&
              !window.confirm(
                'Open another question? Your current workspace edits will be replaced.'
              )
            ) {
              return;
            }

            handleSelectProblem(problem.id);
          }

          setShowDashboard(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f10] text-[#ededed] overflow-hidden">
      <EditorToolbar
        onBack={() => setShowDashboard(true)}
        problemTitle={currentProblem.title}
        difficulty={currentProblem.difficulty}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        onReset={handleReset}
        onRunTestCases={handleRunTestCases}
        isDsaRunning={isDsaRunning}
        onSubmitSolution={handleSubmitSolution}
        isSubmitting={isSubmitting}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 md:w-96 bg-[#0f0f10] border-r border-white/[0.08] flex flex-col select-none shrink-0 overflow-hidden">
          <DsaProblemTab
            currentProblem={currentProblem}
            problems={problems}
            onSelectProblem={handleSelectProblem}
          />
        </aside>

        <div className="flex-1 flex flex-col bg-[#141415] overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <CodeEditor
              file={activeFile}
              onChange={handleCodeChange}
            />
          </main>

          <OutputTerminal
            logs={logs}
            failureCount={failureCount}
            activeTab={bottomTab}
            onTabChange={setBottomTab}
            onClear={() => {
              setLogs([]);
              setFailureCount(0);
            }}
            testCases={testCases}
            onUpdateTestCase={handleUpdateTestCase}
            onAddTestCase={handleAddTestCase}
            onRemoveTestCase={handleRemoveTestCase}
            dsaRunSummary={dsaRunSummary}
            isDsaRunning={isDsaRunning}
            dsaSubmissionResult={dsaSubmissionResult}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
