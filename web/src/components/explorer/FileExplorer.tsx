import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';
import { FileTreeItem } from './FileTreeItem';

interface Props {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
}

type FolderName = ProjectFile['folder'];

const DEFAULT_FOLDERS: FolderName[] = [
  'server',
  'web',
  'execution-engine',
  'shared',
];

export function FileExplorer({ files, activeFileId, onSelectFile }: Props) {
  const [openFolders, setOpenFolders] = useState<Partial<Record<FolderName, boolean>>>({
    server: true,
    web: true,
    'execution-engine': true,
    shared: false,
  });

  const folders = useMemo(() => {
    const dynamicFolders = files
      .map((f) => f.folder)
      .filter((folder): folder is FolderName => folder !== 'root');

    return Array.from(new Set<FolderName>([...DEFAULT_FOLDERS, ...dynamicFolders]));
  }, [files]);

  const toggleFolder = (folder: FolderName) =>
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));

  const rootFiles = useMemo(
    () => files.filter((f) => f.folder === 'root'),
    [files]
  );

  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col select-none">
      <div className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] border-b border-[#30363d]">
        DebugLabs Explorer
      </div>

      <div className="flex-1 overflow-y-auto py-2 text-sm">
        {folders.map((folder) => {
          const isOpen = Boolean(openFolders[folder]);
          const folderFiles = files.filter((f) => f.folder === folder);

          return (
            <div key={folder}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1 hover:bg-[#21262d] text-[#c9d1d9] cursor-pointer"
              >
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]" />
                )}
                {isOpen ? (
                  <FolderOpen className="w-4 h-4 text-sky-400" />
                ) : (
                  <Folder className="w-4 h-4 text-sky-400" />
                )}
                <span>{folder}</span>
              </button>

              {isOpen && (
                <div className="pl-6">
                  {folderFiles.map((file) => (
                    <FileTreeItem
                      key={file.id}
                      file={file}
                      isActive={file.id === activeFileId}
                      onSelect={onSelectFile}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {rootFiles.length > 0 && (
          <div className="mt-1">
            {rootFiles.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                isActive={file.id === activeFileId}
                onSelect={onSelectFile}
                className="px-4"
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}