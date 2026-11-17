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
    <aside className="w-60 bg-[#0f0f10] border-r border-white/[0.08] flex flex-col select-none shrink-0">
      <div className="h-9 px-3.5 flex items-center justify-between text-xs font-medium text-[#85858b] border-b border-white/[0.08]">
        <span>Explorer</span>
        <span className="text-[11px] font-mono text-[#85858b]/70">
          {files.length} files
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-sm custom-scrollbar">
        {folders.map((folder) => {
          const isOpen = Boolean(openFolders[folder]);
          const folderFiles = files.filter((f) => f.folder === folder);

          return (
            <div key={folder} className="mb-0.5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-[4px] hover:bg-[#161618] text-[#a1a1a6] hover:text-[#ededed] cursor-pointer transition-colors duration-150"
              >
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5]" />
                )}
                {isOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5]" />
                )}
                <span className="font-mono text-[12px]">{folder}</span>
              </button>

              {isOpen && (
                <div className="pl-4 mt-0.5 space-y-0.5">
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
          <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-0.5">
            {rootFiles.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                isActive={file.id === activeFileId}
                onSelect={onSelectFile}
                className="px-2"
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
