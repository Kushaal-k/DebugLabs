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
      className={`w-full flex items-center gap-2 py-1 text-left text-xs cursor-pointer rounded-[4px] transition-colors duration-150 ${paddingClass} ${
        isActive
          ? 'bg-[#1e1e21] text-[#ededed] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
          : 'text-[#a1a1a6] hover:bg-[#161618] hover:text-[#ededed]'
      }`}
    >
      <FileCode2 className="w-3.5 h-3.5 shrink-0 text-[#85858b] stroke-[1.5]" />
      <span className="font-mono text-[12px] truncate">{file.name}</span>
    </button>
  );
}
