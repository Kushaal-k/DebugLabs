import { useState, useCallback } from 'react';
import { BookOpen, FolderTree } from 'lucide-react';
import { DsaDashboard } from './components/dsa/DsaDashboard';
import { DEBUGLABS_SCENARIO_FILES } from './data/mockScenarios';
import { DEFAULT_DSA_PROBLEMS } from './data/dsaScenarios';
import type { ProjectFile } from './types/workspace';
import type {
  DsaProblem,
  DsaTestCase,
  DsaRunSummary,
} from './types/dsa';
import type { SupportedLanguage } from '@debugLabs/shared';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CodeEditor } from './components/editor/CodeEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { EditorTabs } from './components/editor/EditorTabs';
import {
  OutputTerminal,
  type BottomPanelTab,
} from './components/terminal/OutputTerminal';
import { DsaProblemTab } from './components/dsa/DsaProblemTab';
import { executeSingleFile } from './services/executionService';
import { runDsaTestCases } from './services/dsaRunnerService';

export type LeftSidebarTab = 'dsa' | 'explorer';

export default function App() {
  const [showDashboard, setShowDashboard] = useState(true);

  const [files, setFiles] = useState<ProjectFile[]>(
    DEBUGLABS_SCENARIO_FILES
  );

  const [openTabIds, setOpenTabIds] = useState<string[]>([
    'dsa-solution',
    'server-index',
    'problem-md',
  ]);

  const [activeFileId, setActiveFileId] =
    useState<string>('dsa-solution');

  const [leftTab, setLeftTab] = useState<LeftSidebarTab>('dsa');

  const [bottomTab, setBottomTab] =
    useState<BottomPanelTab>('testcases');

  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [failureCount, setFailureCount] = useState<number>(0);

  const [currentProblem, setCurrentProblem] = useState<DsaProblem>(
    DEFAULT_DSA_PROBLEMS[0]
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('javascript');

  const [testCases, setTestCases] = useState<DsaTestCase[]>(
    DEFAULT_DSA_PROBLEMS[0].testCases
  );

  const [dsaRunSummary, setDsaRunSummary] =
    useState<DsaRunSummary | null>(null);

  const [isDsaRunning, setIsDsaRunning] = useState<boolean>(false);

  const activeFile =
    files.find((file) => file.id === activeFileId) || null;

  const openFiles = openTabIds
    .map((id) => files.find((file) => file.id === id))
    .filter((file): file is ProjectFile => Boolean(file));

  const handleSelectFile = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds((previous) => [...previous, id]);
    }

    setActiveFileId(id);
  };

  const handleCloseTab = (id: string) => {
    const updated = openTabIds.filter((tabId) => tabId !== id);

    setOpenTabIds(updated);

    if (activeFileId === id) {
      setActiveFileId(
        updated.length > 0 ? updated[updated.length - 1] : ''
      );
    }
  };

  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue === undefined || !activeFile) {
      return;
    }

    setFiles((previous) =>
      previous.map((file) =>
        file.id === activeFile.id
          ? { ...file, content: newValue }
          : file
      )
    );
  };

  const handleReset = () => {
    setFiles(DEBUGLABS_SCENARIO_FILES);
    setCurrentProblem(DEFAULT_DSA_PROBLEMS[0]);
    setSelectedLanguage('javascript');
    setTestCases(DEFAULT_DSA_PROBLEMS[0].testCases);
    setDsaRunSummary(null);
    setFailureCount(0);
    setActiveFileId('dsa-solution');
    setOpenTabIds(['dsa-solution', 'server-index', 'problem-md']);

    setLogs((previous) => [
      ...previous,
      '\x1b[90mWorkspace and test cases restored to initial state\x1b[0m',
    ]);
  };

  const handleSelectLanguage = (newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage);

    const fileNames: Record<SupportedLanguage, string> = {
      javascript: 'solution.js',
      python: 'solution.py',
      cpp: 'solution.cpp',
      java: 'Solution.java',
    };

    setFiles((previous) =>
      previous.map((file) => {
        if (file.id === 'dsa-solution') {
          return {
            ...file,
            name: fileNames[newLanguage],
            language: newLanguage,
            content:
              currentProblem.starterCode[newLanguage] || file.content,
          };
        }

        return file;
      })
    );

    setLogs((previous) => [
      ...previous,
      `\x1b[36m[Language]\x1b[0m Switched active DSA environment to ${newLanguage.toUpperCase()}`,
    ]);
  };

  const handleSelectProblem = (problem: DsaProblem) => {
    setCurrentProblem(problem);
    setTestCases(problem.testCases);
    setDsaRunSummary(null);

    setFiles((previous) =>
      previous.map((file) => {
        if (file.id === 'dsa-solution') {
          return {
            ...file,
            content:
              problem.starterCode[selectedLanguage] || file.content,
          };
        }

        return file;
      })
    );

    setLogs((previous) => [
      ...previous,
      `\x1b[36m[DSA Question]\x1b[0m Loaded "${problem.title}" (${problem.difficulty})`,
    ]);
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
      name: `Custom ${testCases.length + 1}`,
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
    const solutionFile =
      files.find((file) => file.id === 'dsa-solution') || activeFile;

    if (!solutionFile) {
      return;
    }

    setIsDsaRunning(true);
    setBottomTab('results');

    setLogs((previous) => [
      ...previous,
      '',
      `\x1b[36m→ Evaluating ${testCases.length} test cases for ${currentProblem.title} (${selectedLanguage})...\x1b[0m`,
    ]);

    try {
      const summary = await runDsaTestCases(
        solutionFile.content,
        selectedLanguage,
        currentProblem,
        testCases
      );

      setDsaRunSummary(summary);

      if (summary.status === 'passed') {
        setLogs((previous) => [
          ...previous,
          `\x1b[32m✓ All ${summary.total} test cases passed!\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
        ]);
      } else {
        setLogs((previous) => [
          ...previous,
          `\x1b[31m✗ ${summary.passed}/${summary.total} test cases passed. ${summary.failed} failed.\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
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
    activeFile,
    currentProblem,
    files,
    selectedLanguage,
    testCases,
  ]);

  const handleRunFile = async () => {
    const targetFile = activeFile || files[0];

    if (!targetFile) {
      return;
    }

    if (
      targetFile.language === 'markdown' ||
      targetFile.name.endsWith('.md')
    ) {
      setBottomTab('output');

      setLogs((previous) => [
        ...previous,
        '',
        `\x1b[33m[notice]\x1b[0m ${targetFile.name} is documentation and cannot be executed directly`,
      ]);

      return;
    }

    setIsRunning(true);
    setBottomTab('output');

    setLogs((previous) => [
      ...previous,
      '',
      `\x1b[90m$ run ${targetFile.name} (${targetFile.language})\x1b[0m`,
    ]);

    try {
      const result = await executeSingleFile(targetFile);

      if (result.stdout) {
        setLogs((previous) => [
          ...previous,
          result.stdout.trimEnd(),
        ]);
      }

      if (result.stderr) {
        setLogs((previous) => [
          ...previous,
          `\x1b[31m${result.stderr.trimEnd()}\x1b[0m`,
        ]);
      }

      if (result.success) {
        setFailureCount(0);

        setLogs((previous) => [
          ...previous,
          `\x1b[32mProcess completed in ${result.executionTimeMs}ms\x1b[0m \x1b[90m(exit code: 0, memory: ${result.memoryMb.toFixed(1)}MB)\x1b[0m`,
        ]);
      } else {
        setFailureCount((count) => count + 1);

        setLogs((previous) => [
          ...previous,
          `\x1b[31mProcess exited with code ${result.exitCode}\x1b[0m \x1b[90m(${result.executionTimeMs}ms, memory: ${result.memoryMb.toFixed(1)}MB)\x1b[0m`,
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Execution failed';

      setFailureCount((count) => count + 1);

      setLogs((previous) => [
        ...previous,
        `\x1b[31m${message}\x1b[0m`,
        '\x1b[31mProcess terminated with code 1\x1b[0m',
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  if (showDashboard) {
    return (
      <DsaDashboard
        onOpenProblem={(problem) => {
          if (problem.id !== currentProblem.id) {
            const solution = files.find(
              (file) => file.id === 'dsa-solution'
            );

            const originalSolution = DEBUGLABS_SCENARIO_FILES.find(
              (file) => file.id === 'dsa-solution'
            );

            const hasEdits =
              solution &&
              solution.content !==
                currentProblem.starterCode[selectedLanguage] &&
              solution.content !== originalSolution?.content;

            if (
              hasEdits &&
              !window.confirm(
                'Open another question? Your current workspace edits will be replaced.'
              )
            ) {
              return;
            }

            handleSelectProblem(problem);
          }

          handleSelectFile('dsa-solution');
          setShowDashboard(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f10] text-[#ededed] overflow-hidden">
      <nav
        aria-label="Workspace navigation"
        className="flex shrink-0 items-center gap-4 border-b border-white/10 px-4 py-2"
      >
        <button
          type="button"
          onClick={() => setShowDashboard(true)}
          disabled={isRunning || isDsaRunning}
          className="rounded px-2 py-1 text-xs text-lime-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-lime-200 disabled:opacity-40"
        >
          ← Questions
        </button>

        <span className="text-xs text-zinc-400">
          {currentProblem.title}
        </span>
      </nav>

      <EditorToolbar
        activeFile={activeFile || files[0]}
        isRunning={isRunning}
        onRunFile={handleRunFile}
        onReset={handleReset}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        onRunTestCases={handleRunTestCases}
        isDsaRunning={isDsaRunning}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-[#0f0f10] border-r border-white/[0.08] flex flex-col select-none shrink-0 overflow-hidden">
          <div className="h-9 bg-[#0f0f10] border-b border-white/[0.08] flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('dsa')}
              className={`flex-1 h-full flex items-center justify-center gap-2 text-xs border-r border-white/[0.06] cursor-pointer transition-colors ${
                leftTab === 'dsa'
                  ? 'bg-[#141415] text-[#ededed] font-medium border-b-2 border-b-emerald-400'
                  : 'text-[#85858b] hover:text-[#ededed] hover:bg-[#141415]/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 stroke-[1.5] text-emerald-400" />
              <span>DSA Question</span>
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('explorer')}
              className={`flex-1 h-full flex items-center justify-center gap-2 text-xs cursor-pointer transition-colors ${
                leftTab === 'explorer'
                  ? 'bg-[#141415] text-[#ededed] font-medium border-b-2 border-b-emerald-400'
                  : 'text-[#85858b] hover:text-[#ededed] hover:bg-[#141415]/50'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 stroke-[1.5] text-sky-400" />
              <span>Explorer</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === 'dsa' ? (
              <DsaProblemTab
                currentProblem={currentProblem}
                onSelectProblem={handleSelectProblem}
              />
            ) : (
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
              />
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-[#141415] overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <EditorTabs
              openFiles={openFiles}
              activeFileId={activeFileId}
              onSelectTab={setActiveFileId}
              onCloseTab={handleCloseTab}
            />

            {activeFile ? (
              <CodeEditor
                file={activeFile}
                onChange={handleCodeChange}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-[#85858b]">
                Select a file from the explorer or problem tab to
                begin editing
              </div>
            )}
          </main>

          <OutputTerminal
            logs={logs}
            isRunning={isRunning}
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
            onRunTestCases={handleRunTestCases}
            dsaRunSummary={dsaRunSummary}
            isDsaRunning={isDsaRunning}
          />
        </div>
      </div>
    </div>
  );
}