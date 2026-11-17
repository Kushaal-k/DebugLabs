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
      '\x1b[33m[Reset]\x1b[0m Workspace files restored to initial challenge state.',
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
        `\x1b[33m[Notice]\x1b[0m ${targetFile.name} is a documentation file and cannot be executed directly. Please select a code file.`,
      ]);
      return;
    }

    setIsRunning(true);
    setBottomTab('output');
    setLogs((prev) => [
      ...prev,
      '',
      `\x1b[36m→ Executing ${targetFile.name} (${targetFile.language}) in container sandbox...\x1b[0m`,
      '\x1b[90m--------------------------------------------------\x1b[0m',
    ]);

    try {
      const result = await executeSingleFile(targetFile);

      if (result.stdout) {
        setLogs((prev) => [...prev, result.stdout]);
      }
      if (result.stderr) {
        setLogs((prev) => [...prev, `\x1b[31m${result.stderr}\x1b[0m`]);
      }

      if (result.success) {
        setFailureCount(0);
        setLogs((prev) => [
          ...prev,
          `\x1b[32m✓ Finished: ${targetFile.name}\x1b[0m (exit code: ${result.exitCode}, time: ${result.executionTimeMs}ms, memory: ${result.memoryMb.toFixed(1)}MB)`,
        ]);
      } else {
        setFailureCount((c) => c + 1);
        setLogs((prev) => [
          ...prev,
          `\x1b[31m✗ Failed: ${targetFile.name}\x1b[0m (exit code: ${result.exitCode}, time: ${result.executionTimeMs}ms, memory: ${result.memoryMb.toFixed(1)}MB)`,
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown execution error';
      setFailureCount((c) => c + 1);
      setLogs((prev) => [
        ...prev,
        `\x1b[31m${message}\x1b[0m`,
        `\x1b[31m✗ Execution failed (exit code: 1, time: 0ms, memory: 0.0MB)\x1b[0m`,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#e6edf3]">
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

        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
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
              <div className="flex-1 flex items-center justify-center text-sm text-[#8b949e]">
                Select a file from the DebugLabs Explorer to start debugging
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
