import type { ProjectFile } from '../../types/workspace';

interface Props {
  file: ProjectFile;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function FileTreeItem({ file, isActive, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(file.id)}
      className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs cursor-pointer rounded transition ${
        isActive
          ? 'bg-[#1f6feb]/20 text-sky-300 border-r-2 border-sky-400 font-medium'
          : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 shrink-0"
        aria-hidden="true"
      >
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" />
        <path d="M14 2v5h5" />
        <path d="m9 13 2 2-2 2" />
        <path d="m15 13-2 2 2 2" />
      </svg>
      <span className="truncate">{file.name}</span>
    </button>
  );
}
