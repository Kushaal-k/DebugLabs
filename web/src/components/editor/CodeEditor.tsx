import Editor, { loader, type BeforeMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { ProjectFile } from '../../types/workspace';

loader.config({ monaco });

interface Props {
  file: ProjectFile;
  onChange: (value: string | undefined) => void;
}

function getMonacoLanguage(lang?: string, fileName?: string): string {
  if (lang) {
    const l = lang.toLowerCase();
    if (l === 'js') return 'javascript';
    if (l === 'ts') return 'typescript';
    if (l === 'py') return 'python';
    if (l === 'cs') return 'csharp';
    return l;
  }
  if (fileName) {
    if (fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.cpp') || fileName.endsWith('.hpp') || fileName.endsWith('.cc')) return 'cpp';
    if (fileName.endsWith('.c') || fileName.endsWith('.h')) return 'c';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.cs')) return 'csharp';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.md')) return 'markdown';
  }
  return 'javascript';
}

export function CodeEditor({ file, onChange }: Props) {
  const language = getMonacoLanguage(file.language, file.name);

  const handleEditorWillMount: BeforeMount = (monacoInstance) => {
    monacoInstance.editor.defineTheme('debuglabs-graphite', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '85858b', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'e57373' },
        { token: 'string', foreground: '90caf9' },
        { token: 'number', foreground: '80cbc4' },
        { token: 'type', foreground: 'ce93d8' },
      ],
      colors: {
        'editor.background': '#0c0d12e6',
        'editor.foreground': '#ededed',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editorLineNumber.foreground': '#4a4a54',
        'editorLineNumber.activeForeground': '#ededed',
        'editorGutter.background': '#0c0d12e6',
        'editor.selectionBackground': '#ffffff18',
        'editorCursor.foreground': '#6ee7b7',
      },
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.06] px-4">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
        <span className="font-mono text-[12px] text-[#c8c8ce]">{file.name}</span>
      </div>
      <div className="min-h-0 flex-1">
      <Editor
        height="100%"
        language={language}
        value={file.content}
        theme="debuglabs-graphite"
        beforeMount={handleEditorWillMount}
        onChange={onChange}
        options={{
          ariaLabel: `Code editor for ${file.name}`,
          fontSize: 13,
          lineHeight: 22,
          fontFamily: "'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
        loading={
          <div className="flex h-full items-center justify-center text-xs font-mono text-[#85858b]">
            Loading editor…
          </div>
        }
      />
      </div>
    </div>
  );
}
