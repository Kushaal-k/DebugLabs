import { useState } from 'react';
import { DEBUGLABS_SCENARIO_FILES } from './data/mockScenarios';
import type { ProjectFile } from './types/workspace';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CodeEditor } from './components/editor/CodeEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { EditorTabs } from './components/editor/EditorTabs';

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(DEBUGLABS_SCENARIO_FILES);
  const [openTabIds, setOpenTabIds] = useState<string[]>([
    'server-index',
    'problem-md',
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('server-index');

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

  const handleReset = () => setFiles(DEBUGLABS_SCENARIO_FILES);

  const handleRunTests = () => {
    alert(`Submitting ${files.length} files to DebugLabs execution-engine...`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#e6edf3]">
      <EditorToolbar
        activeFile={activeFile || files[0]}
        onRunTests={handleRunTests}
        onReset={handleReset}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
        />

        <main className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
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
      </div>
    </div>
  );
}
