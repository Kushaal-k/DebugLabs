import type { ProjectFile } from '../../types/workspace';

interface Props {
  file: ProjectFile;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ file, onChange }: Props) {
  return (
    <div className="flex-1 h-full">
      <textarea
        aria-label={`Code editor for ${file.name}`}
        value={file.content}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="h-full w-full resize-none border-0 bg-[#1e1e1e] p-3 font-mono text-sm text-white outline-none"
      />
    </div>
  );
}
