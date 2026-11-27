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
import { LabShell } from './components/common/LabShell';
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

const INITIAL_LANGUAGE: SupportedLanguage = 'javascript';

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
    useState<SupportedLanguage>(INITIAL_LANGUAGE);

  const [files, setFiles] = useState<ProjectFile[]>([
    {
      id: 'dsa-solution',
      name: FILE_NAMES[INITIAL_LANGUAGE],
      folder: 'root',
      language: INITIAL_LANGUAGE,
      content: DEFAULT_DSA_PROBLEMS[0].starterCode[INITIAL_LANGUAGE] || '',
    },
  ]);

  const [bottomTab, setBottomTab] =
    useState<BottomPanelTab>('testcases');

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

  // Panel sizing and resizer states
  const [leftWidth, setLeftWidth] = useState<number>(520);
  const [bottomHeight, setBottomHeight] = useState<number>(300);
  const [isDraggingH, setIsDraggingH] = useState<boolean>(false);
  const [isDraggingV, setIsDraggingV] = useState<boolean>(false);

  const startDraggingH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  }, []);

  const startDraggingV = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingV(true);
  }, []);

  useEffect(() => {
    if (!isDraggingH && !isDraggingV) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH) {
        const minW = 260;
        const maxW = Math.max(minW, window.innerWidth * 0.65);
        const newWidth = Math.max(minW, Math.min(e.clientX, maxW));
        setLeftWidth(newWidth);
      }
      if (isDraggingV) {
        const minH = 120;
        const maxH = Math.max(minH, window.innerHeight - 180);
        const newHeight = Math.max(
          minH,
          Math.min(window.innerHeight - e.clientY, maxH)
        );
        setBottomHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingH(false);
      setIsDraggingV(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingH, isDraggingV]);

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
                name: FILE_NAMES[INITIAL_LANGUAGE] || 'solution.js',
                folder: 'root',
                language: INITIAL_LANGUAGE,
                content:
                  firstProblem.starterCode[INITIAL_LANGUAGE] || '',
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
  }, []);

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
    } catch (err: unknown) {
      console.error('Failed to load problem:', err);
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

    try {
      const summary = await runDsaTestCases(
        currentProblem.id,
        selectedLanguage,
        solutionFile.content,
        testCases
      );

      setDsaRunSummary(summary);
    } catch (error) {
      console.error('Test evaluation error:', error);
    } finally {
      setIsDsaRunning(false);
    }
  }, [
    currentProblem.id,
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

    try {
      const result = await submitDsaSolution(
        currentProblem.id,
        selectedLanguage,
        solutionFile.content
      );

      setDsaSubmissionResult(result);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentProblem.id,
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
    <LabShell>
      <div className="relative z-10 flex h-full flex-col gap-2.5 p-2.5 select-none">
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

        <div className="flex min-h-0 flex-1">
          <aside
            style={{ width: `${leftWidth}px` }}
            className="glass-panel flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl"
          >
            <DsaProblemTab
              currentProblem={currentProblem}
              problems={problems}
              onSelectProblem={handleSelectProblem}
            />
          </aside>

          <div
            onMouseDown={startDraggingH}
            className="lab-resize-col z-20"
            title="Drag to resize panel"
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <main className="glass-panel relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
              <CodeEditor
                file={activeFile}
                onChange={handleCodeChange}
              />
            </main>

            <div
              onMouseDown={startDraggingV}
              className="lab-resize-row z-20"
              title="Drag to resize panel"
            />

            <OutputTerminal
              height={bottomHeight}
              activeTab={bottomTab}
              onTabChange={setBottomTab}
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

      {(isDraggingH || isDraggingV) && (
        <div
          className={`fixed inset-0 z-50 select-none ${
            isDraggingH ? 'cursor-col-resize' : 'cursor-row-resize'
          }`}
        />
      )}
    </LabShell>
  );
}
