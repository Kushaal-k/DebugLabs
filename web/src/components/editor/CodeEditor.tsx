import type { ProjectFile } from '../../types/workspace';

interface Props {
  file: ProjectFile;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ file, onChange }: Props) {
  return (
    <div className="flex-1 h-full flex flex-col bg-[#141415] overflow-hidden">
      <textarea
        aria-label={`Code editor for ${file.name}`}
        value={file.content}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="h-full w-full resize-none border-0 bg-[#141415] p-4 font-mono text-[13px] leading-[22px] text-[#ededed] placeholder-[#85858b] selection:bg-white/15 outline-none custom-scrollbar"
      />
    </div>
  );
}
