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
    <div className="h-9 bg-[#0f0f10] border-b border-white/[0.08] flex items-center overflow-x-auto select-none shrink-0 custom-scrollbar">
      {openFiles.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTab(file.id)}
            className={`h-full flex items-center gap-2 px-3 text-xs cursor-pointer border-r transition-colors duration-150 ${
              isActive
                ? 'bg-[#141415] text-[#ededed] border-r-white/[0.08] font-medium'
                : 'bg-[#0f0f10] text-[#85858b] border-r-white/[0.05] hover:text-[#a1a1a6] hover:bg-[#141415]/50'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#85858b] shrink-0 stroke-[1.5]" />
            <span className="font-mono text-[12px] truncate max-w-[140px]">
              {file.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(file.id);
              }}
              className="p-0.5 rounded-[3px] text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.08] cursor-pointer transition-colors duration-100"
              title={`Close ${file.name}`}
            >
              <X className="w-3 h-3 stroke-[1.5]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
