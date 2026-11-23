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
    monacoInstance.editor.defineTheme('debuglabs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f97583' },
        { token: 'string', foreground: '9ecbff' },
        { token: 'number', foreground: '79b8ff' },
      ],
      colors: {
        'editor.background': '#141415',
        'editor.foreground': '#ededed',
        'editor.lineHighlightBackground': '#1f1f2380',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#ededed',
        'editorGutter.background': '#141415',
        'editor.selectionBackground': '#264f78',
      },
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#141415] overflow-hidden">
      <Editor
        height="100%"
        language={language}
        value={file.content}
        theme="debuglabs-dark"
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
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
        loading={
          <div className="flex h-full items-center justify-center text-xs font-mono text-[#85858b]">
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
}
