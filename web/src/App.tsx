import { useState } from 'react';
import { DEBUGLABS_SCENARIO_FILES } from './data/mockScenarios';
import type { ProjectFile } from './types/workspace';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CodeEditor } from './components/editor/CodeEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { EditorTabs } from './components/editor/EditorTabs';
import { OutputTerminal, type BottomPanelTab } from './components/terminal/OutputTerminal';
import { executeSingleFile } from './services/executionService';

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(DEBUGLABS_SCENARIO_FILES);
  const [openTabIds, setOpenTabIds] = useState<string[]>([
    'server-index',
    'problem-md',
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('server-index');
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('output');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [failureCount, setFailureCount] = useState<number>(0);

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
    setFailureCount(0);
    setLogs((prev) => [
      ...prev,
      '\x1b[90mWorkspace files restored to initial scenario state\x1b[0m',
    ]);
  };

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
      />

      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
        />

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
                Select a file from the explorer to begin editing
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
          />
        </div>
      </div>
    </div>
  );
}
