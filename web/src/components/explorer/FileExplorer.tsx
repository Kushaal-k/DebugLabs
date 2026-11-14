import { useState } from 'react';
import type { ProjectFile } from '../../types/workspace';

interface Props {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
}

type IconProps = { className?: string };

function FileCodeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" />
      <path d="M14 2v5h5" />
      <path d="m9 13 2 2-2 2" />
      <path d="m15 13-2 2 2 2" />
    </svg>
  );
}

function FolderIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l1.5 2H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
    </svg>
  );
}

function FolderOpenIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h4l1.5 2h7A2.5 2.5 0 0 1 20.5 10.5L19 18a2.5 2.5 0 0 1-2.5 2h-11A2.5 2.5 0 0 1 3 17.5v-9Z" />
      <path d="M3 8.5h16" />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const FOLDERS: Array<ProjectFile['folder']> = [
  'server',
  'web',
  'execution-engine',
  'shared',
];

export function FileExplorer({ files, activeFileId, onSelectFile }: Props) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    server: true,
    web: true,
    'execution-engine': true,
    shared: false,
  });

  const toggleFolder = (folder: string) =>
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));

  const rootFiles = files.filter((f) => f.folder === 'root');

  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col select-none">
      <div className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] border-b border-[#30363d]">
        DebugLabs Explorer
      </div>

      <div className="flex-1 overflow-y-auto py-2 text-sm">
        {FOLDERS.map((folder) => {
          const isOpen = openFolders[folder];
          const folderFiles = files.filter((f) => f.folder === folder);

          return (
            <div key={folder}>
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1 hover:bg-[#21262d] text-[#c9d1d9] cursor-pointer"
              >
                {isOpen ? <ChevronDownIcon className="w-3.5 h-3.5 text-[#8b949e]" /> : <ChevronRightIcon className="w-3.5 h-3.5 text-[#8b949e]" />}
                {isOpen ? <FolderOpenIcon className="w-4 h-4 text-sky-400" /> : <FolderIcon className="w-4 h-4 text-sky-400" />}
                <span>{folder}</span>
              </button>

              {isOpen && (
                <div className="pl-6">
                  {folderFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onSelectFile(file.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-left cursor-pointer ${
                        file.id === activeFileId
                          ? 'bg-[#1f6feb]/20 text-sky-300 border-r-2 border-sky-400'
                          : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
                      }`}
                    >
                      <FileCodeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-1">
          {rootFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full flex items-center gap-2 px-4 py-1 text-left cursor-pointer ${
                file.id === activeFileId
                  ? 'bg-[#1f6feb]/20 text-sky-300 border-r-2 border-sky-400'
                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
              }`}
            >
              <FileCodeIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
