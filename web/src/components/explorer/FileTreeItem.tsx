import { FileCode2 } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';

interface Props {
  file: ProjectFile;
  isActive: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export function FileTreeItem({ file, isActive, onSelect, className }: Props) {
  const paddingClass = className ?? 'px-2';

  return (
    <button
      type="button"
      title={file.name}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onSelect(file.id)}
      className={`w-full flex items-center gap-2 py-1 text-left text-xs cursor-pointer rounded transition ${paddingClass} ${
        isActive
          ? 'bg-[#1f6feb]/20 text-sky-300 border-r-2 border-sky-400 font-medium'
          : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
      }`}
    >
      <FileCode2 className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{file.name}</span>
    </button>
  );
}