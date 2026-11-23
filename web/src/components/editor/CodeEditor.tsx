import { useState, useRef, useCallback } from 'react';
import Editor, { loader, type BeforeMount, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { ProjectFile } from '../../types/workspace';

loader.config({ monaco });

interface Props {
  file: ProjectFile;
  onChange: (value: string | undefined) => void;
}

const DRIVER_START_PATTERN = /\n?\s*(?:\/\/|#)\s*\{\s*Driver Code Starts/i;

function splitDriverCode(fullContent: string): {
  hasDriver: boolean;
  userCode: string;
  driverCode: string;
} {
  const match = fullContent.match(DRIVER_START_PATTERN);
  if (!match || match.index === undefined) {
    return {
      hasDriver: false,
      userCode: fullContent,
      driverCode: '',
    };
  }

  const userCode = fullContent.slice(0, match.index);
  const driverCode = fullContent.slice(match.index);

  return {
    hasDriver: true,
    userCode,
    driverCode,
  };
}

function combineCode(userCode: string, driverCode: string): string {
  if (!driverCode) return userCode;
  return `${userCode.trimEnd()}\n\n${driverCode.trimStart()}`;
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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [showDriverCode, setShowDriverCode] = useState(false);

  const { hasDriver, userCode, driverCode } = splitDriverCode(file.content);
  const driverCodeRef = useRef(driverCode);
  driverCodeRef.current = driverCode;

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

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = useCallback(
    (newValue: string | undefined) => {
      const val = newValue ?? '';
      if (hasDriver) {
        // User edits class Solution -> seamlessly recombine with untouchable driver code
        const combined = combineCode(val, driverCodeRef.current);
        onChange(combined);
      } else {
        onChange(val);
      }
    },
    [hasDriver, onChange]
  );

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 select-none">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          <span className="font-mono text-[12px] text-[#c8c8ce]">{file.name}</span>
        </div>

        {hasDriver && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDriverCode((prev) => !prev)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#a1a1a6] transition-colors hover:bg-white/[0.08] hover:text-[#ededed]"
              title={
                showDriverCode
                  ? 'Hide driver code'
                  : 'Show driver code (read-only I/O parsing)'
              }
            >
              {showDriverCode ? (
                <EyeOff className="h-3 w-3 stroke-[1.75]" />
              ) : (
                <Eye className="h-3 w-3 stroke-[1.75]" />
              )}
              <span>{showDriverCode ? 'Hide Driver Code' : 'Show Driver Code'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Solution Editor */}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={hasDriver ? userCode : file.content}
          theme="debuglabs-graphite"
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleCodeChange}
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

      {/* Read-Only Driver Code Viewer */}
      {hasDriver && showDriverCode && (
        <div className="flex h-56 shrink-0 flex-col border-t border-white/[0.08] bg-[#0c0d12]">
          <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0e0f14] px-4 select-none">
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-emerald-400/90 stroke-[2]" />
              <span className="font-mono text-[11px] font-medium text-[#c8c8ce]">
                Driver Code <span className="text-[#85858b] font-normal">(Read-Only)</span>
              </span>
            </div>
            <span className="text-[10px] text-[#85858b]">I/O parsing &amp; test harness</span>
          </div>

          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              language={language}
              value={driverCode}
              theme="debuglabs-graphite"
              options={{
                readOnly: true,
                domReadOnly: true,
                fontSize: 12,
                lineHeight: 20,
                fontFamily: "'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                padding: { top: 8, bottom: 8 },
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
                smoothScrolling: true,
                cursorBlinking: 'solid',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
