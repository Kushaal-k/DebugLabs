import { useState, useCallback } from 'react';
import { BookOpen, FolderTree } from 'lucide-react';
import { DEBUGLABS_SCENARIO_FILES } from './data/mockScenarios';
import { DEFAULT_DSA_PROBLEMS } from './data/dsaScenarios';
import type { ProjectFile } from './types/workspace';
import type { DsaProblem, DsaTestCase, DsaRunSummary } from './types/dsa';
import type { SupportedLanguage } from '@debugLabs/shared';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CodeEditor } from './components/editor/CodeEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { EditorTabs } from './components/editor/EditorTabs';
import { OutputTerminal, type BottomPanelTab } from './components/terminal/OutputTerminal';
import { DsaProblemTab } from './components/dsa/DsaProblemTab';
import { executeSingleFile } from './services/executionService';
import { runDsaTestCases } from './services/dsaRunnerService';

export type LeftSidebarTab = 'dsa' | 'explorer';

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(DEBUGLABS_SCENARIO_FILES);
  const [openTabIds, setOpenTabIds] = useState<string[]>([
    'dsa-solution',
    'server-index',
    'problem-md',
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('dsa-solution');
  const [leftTab, setLeftTab] = useState<LeftSidebarTab>('dsa');
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('testcases');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [failureCount, setFailureCount] = useState<number>(0);

  // DSA State
  const [currentProblem, setCurrentProblem] = useState<DsaProblem>(DEFAULT_DSA_PROBLEMS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [testCases, setTestCases] = useState<DsaTestCase[]>(DEFAULT_DSA_PROBLEMS[0].testCases);
  const [dsaRunSummary, setDsaRunSummary] = useState<DsaRunSummary | null>(null);
  const [isDsaRunning, setIsDsaRunning] = useState<boolean>(false);

  const activeFile = files.find((f) => f.id === activeFileId) || null;
  const openFiles = openTabIds
    .map((id) => files.find((f) => f.id === id))
    .filter((f): f is ProjectFile => Boolean(f));

  const handleSelectFile = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds((prev) => [...prev, id]);
    }
    setActiveFileId(id);
  };

  const handleCloseTab = (id: string) => {
    const updated = openTabIds.filter((tabId) => tabId !== id);
    setOpenTabIds(updated);
    if (activeFileId === id) {
      setActiveFileId(updated.length > 0 ? updated[updated.length - 1] : '');
    }
  };

  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue === undefined || !activeFile) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: newValue } : f))
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
    setLogs((prev) => [
      ...prev,
      '\x1b[90mWorkspace and test cases restored to initial state\x1b[0m',
    ]);
  };

  // Language change handler
  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);

    const extMap: Record<SupportedLanguage, { ext: string; fileName: string }> = {
      javascript: { ext: 'js', fileName: 'solution.js' },
      python: { ext: 'py', fileName: 'solution.py' },
      cpp: { ext: 'cpp', fileName: 'solution.cpp' },
      java: { ext: 'java', fileName: 'Solution.java' },
    };

    const targetInfo = extMap[newLang];

    // Update dsa-solution file in the workspace
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === 'dsa-solution') {
          return {
            ...f,
            name: targetInfo.fileName,
            language: newLang,
            content: currentProblem.starterCode[newLang] || f.content,
          };
        }
        return f;
      })
    );

    setLogs((prev) => [
      ...prev,
      `\x1b[36m[Language]\x1b[0m Switched active DSA environment to ${newLang.toUpperCase()}`,
    ]);
  };

  // Problem change handler
  const handleSelectProblem = (problem: DsaProblem) => {
    setCurrentProblem(problem);
    setTestCases(problem.testCases);
    setDsaRunSummary(null);

    // Update the solution file content with new problem starter code
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === 'dsa-solution') {
          return {
            ...f,
            content: problem.starterCode[selectedLanguage] || f.content,
          };
        }
        return f;
      })
    );

    setLogs((prev) => [
      ...prev,
      `\x1b[36m[DSA Question]\x1b[0m Loaded "${problem.title}" (${problem.difficulty})`,
    ]);
  };

  // Test Case handlers
  const handleUpdateTestCase = (updated: DsaTestCase) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));
  };

  const handleAddTestCase = () => {
    const newCaseId = `custom-tc-${Date.now()}`;
    const newCase: DsaTestCase = {
      id: newCaseId,
      name: `Custom ${testCases.length + 1}`,
      input: '',
      expectedOutput: '',
      isCustom: true,
    };
    setTestCases((prev) => [...prev, newCase]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  // Run Test Cases handler
  const handleRunTestCases = useCallback(async () => {
    const solutionFile = files.find((f) => f.id === 'dsa-solution') || activeFile;
    if (!solutionFile) return;

    setIsDsaRunning(true);
    setBottomTab('results');

    setLogs((prev) => [
      ...prev,
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
        setLogs((prev) => [
          ...prev,
          `\x1b[32m✓ All ${summary.total} test cases passed!\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          `\x1b[31m✗ ${summary.passed}/${summary.total} test cases passed. ${summary.failed} failed.\x1b[0m \x1b[90m(${summary.executionTimeMs}ms)\x1b[0m`,
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error evaluating test cases';
      setLogs((prev) => [...prev, `\x1b[31mTest evaluation error: ${message}\x1b[0m`]);
    } finally {
      setIsDsaRunning(false);
    }
  }, [activeFile, currentProblem, files, selectedLanguage, testCases]);

  // Run single file
  const handleRunFile = async () => {
    const targetFile = activeFile || files[0];
    if (!targetFile) return;

    if (targetFile.language === 'markdown' || targetFile.name.endsWith('.md')) {
      setBottomTab('output');
      setLogs((prev) => [
        ...prev,
        '',
        `\x1b[33m[notice]\x1b[0m ${targetFile.name} is documentation and cannot be executed directly`,
      ]);
      return;
    }

    setIsRunning(true);
    setBottomTab('output');
    setLogs((prev) => [
      ...prev,
      '',
      `\x1b[90m$ run ${targetFile.name} (${targetFile.language})\x1b[0m`,
    ]);

    try {
      const result = await executeSingleFile(targetFile);

      if (result.stdout) {
        setLogs((prev) => [...prev, result.stdout.trimEnd()]);
      }
      if (result.stderr) {
        setLogs((prev) => [...prev, `\x1b[31m${result.stderr.trimEnd()}\x1b[0m`]);
      }

      if (result.success) {
        setFailureCount(0);
        setLogs((prev) => [
          ...prev,
          `\x1b[32mProcess completed in ${result.executionTimeMs}ms\x1b[0m \x1b[90m(exit code: 0, memory: ${result.memoryMb.toFixed(1)}MB)\x1b[0m`,
        ]);
      } else {
        setFailureCount((c) => c + 1);
        setLogs((prev) => [
          ...prev,
          `\x1b[31mProcess exited with code ${result.exitCode}\x1b[0m \x1b[90m(${result.executionTimeMs}ms, memory: ${result.memoryMb.toFixed(1)}MB)\x1b[0m`,
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      setFailureCount((c) => c + 1);
      setLogs((prev) => [
        ...prev,
        `\x1b[31m${message}\x1b[0m`,
        `\x1b[31mProcess terminated with code 1\x1b[0m`,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f10] text-[#ededed] overflow-hidden">
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
        {/* Left Sidebar: Problem Description vs File Explorer */}
        <aside className="w-80 bg-[#0f0f10] border-r border-white/[0.08] flex flex-col select-none shrink-0 overflow-hidden">
          {/* Sidebar Mode Tabs */}
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

          {/* Left Panel Content */}
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

        {/* Center & Right Workspace: Editor & Output Panel */}
        <div className="flex-1 flex flex-col bg-[#141415] overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <EditorTabs
              openFiles={openFiles}
              activeFileId={activeFileId}
              onSelectTab={setActiveFileId}
              onCloseTab={handleCloseTab}
            />

            {activeFile ? (
              <CodeEditor file={activeFile} onChange={handleCodeChange} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-[#85858b]">
                Select a file from the explorer or problem tab to begin editing
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
