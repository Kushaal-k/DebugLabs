import { FileCode2, X } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';

interface Props {
  openFiles: ProjectFile[];
  activeFileId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function EditorTabs({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
}: Props) {
  return (
    <div className="h-9 bg-[#0d1117] border-b border-[#30363d] flex items-center overflow-x-auto select-none">
      {openFiles.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <div
            key={file.id}
            onClick={() => onSelectTab(file.id)}
            className={`h-full flex items-center gap-2 px-3 text-xs border-r border-[#30363d] cursor-pointer transition ${
              isActive
                ? 'bg-[#161b22] text-[#e6edf3] border-t-2 border-t-sky-400'
                : 'bg-[#0d1117] text-[#8b949e] hover:bg-[#161b22]/60 hover:text-[#c9d1d9]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate max-w-36">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(file.id);
              }}
              className="p-0.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white cursor-pointer"
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
