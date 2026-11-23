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
  const [leftWidth, setLeftWidth] = useState<number>(380);
  const [bottomHeight, setBottomHeight] = useState<number>(260);
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
    <div className="flex flex-col h-screen w-screen bg-[#08080a] text-[#ededed] overflow-hidden relative select-none">
      {/* Ambient gradient layer for glassmorphic depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.06),rgba(255,255,255,0))] pointer-events-none" />

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

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Drawer: Problem Description */}
        <aside
          style={{ width: `${leftWidth}px` }}
          className="bg-[#0c0c0f]/70 backdrop-blur-xl border-r border-white/[0.08] flex flex-col shrink-0 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
        >
          <DsaProblemTab
            currentProblem={currentProblem}
            problems={problems}
            onSelectProblem={handleSelectProblem}
          />
        </aside>

        {/* Horizontal Resize Handle */}
        <div
          onMouseDown={startDraggingH}
          className="w-1.5 cursor-col-resize relative flex items-center justify-center bg-transparent hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors z-20 group shrink-0"
          title="Drag to resize panel"
        >
          <div className="w-0.5 h-7 rounded-full bg-white/20 group-hover:bg-emerald-400 group-active:bg-emerald-300 transition-colors" />
        </div>

        {/* Right Workspace: Code Editor & Resizable Bottom Panel */}
        <div className="flex-1 flex flex-col bg-[#0c0c0f]/40 backdrop-blur-md overflow-hidden relative">
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <CodeEditor
              file={activeFile}
              onChange={handleCodeChange}
            />
          </main>

          {/* Vertical Resize Handle */}
          <div
            onMouseDown={startDraggingV}
            className="h-1.5 cursor-row-resize relative flex items-center justify-center bg-transparent hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors z-20 group shrink-0"
            title="Drag to resize panel"
          >
            <div className="h-0.5 w-7 rounded-full bg-white/20 group-hover:bg-emerald-400 group-active:bg-emerald-300 transition-colors" />
          </div>

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

      {/* Screen-wide Drag Overlay to prevent Monaco / text from intercepting mouse events */}
      {(isDraggingH || isDraggingV) && (
        <div
          className={`fixed inset-0 z-50 select-none ${
            isDraggingH ? 'cursor-col-resize' : 'cursor-row-resize'
          }`}
        />
      )}
    </div>
  );
}
