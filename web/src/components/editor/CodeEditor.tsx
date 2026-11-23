import { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { loader, type BeforeMount, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
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
  const [isDriverLocked, setIsDriverLocked] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { hasDriver, userCode, driverCode } = splitDriverCode(file.content);
  const driverCodeRef = useRef(driverCode);
  driverCodeRef.current = driverCode;

  // Decide what code string Monaco should display
  const editorValue = showDriverCode ? file.content : userCode;

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

  // Lock enforcement on driver code when visible and locked
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !showDriverCode || !isDriverLocked) return;

    const keyDownDisposable = editor.onKeyDown((e) => {
      const position = editor.getPosition();
      if (!position) return;

      const model = editor.getModel();
      if (!model) return;

      const lines = model.getLinesContent();
      const driverStartLine = lines.findIndex((l) => DRIVER_START_PATTERN.test(l)) + 1;

      if (driverStartLine > 0 && position.lineNumber >= driverStartLine) {
        const isNavKey =
          e.keyCode === monaco.KeyCode.UpArrow ||
          e.keyCode === monaco.KeyCode.DownArrow ||
          e.keyCode === monaco.KeyCode.LeftArrow ||
          e.keyCode === monaco.KeyCode.RightArrow ||
          e.keyCode === monaco.KeyCode.Home ||
          e.keyCode === monaco.KeyCode.End ||
          e.keyCode === monaco.KeyCode.PageUp ||
          e.keyCode === monaco.KeyCode.PageDown ||
          ((e.ctrlKey || e.metaKey) &&
            (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyA));

        if (!isNavKey) {
          e.preventDefault();
          e.stopPropagation();
          setToastMessage("Driver code is locked. Click 'Driver Locked' above to edit I/O.");
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    });

    const contentDisposable = editor.onDidChangeModelContent((e) => {
      const model = editor.getModel();
      if (!model) return;

      const lines = model.getLinesContent();
      const driverStartLine = lines.findIndex((l) => DRIVER_START_PATTERN.test(l)) + 1;
      if (driverStartLine <= 0) return;

      for (const change of e.changes) {
        if (change.range.startLineNumber >= driverStartLine) {
          editor.trigger('lockRevert', 'undo', null);
          setToastMessage("Driver code is locked. Click 'Driver Locked' above to edit I/O.");
          setTimeout(() => setToastMessage(null), 3000);
          break;
        }
      }
    });

    return () => {
      keyDownDisposable.dispose();
      changeDisposableSafe(contentDisposable);
    };
  }, [showDriverCode, isDriverLocked]);

  function changeDisposableSafe(d: monaco.IDisposable) {
    d.dispose();
  }

  const handleCodeChange = useCallback(
    (newValue: string | undefined) => {
      const val = newValue ?? '';
      if (!showDriverCode && hasDriver) {
        // User is editing in pure LeetCode view -> seamlessly recombine with driver code
        const combined = combineCode(val, driverCodeRef.current);
        onChange(combined);
      } else {
        onChange(val);
      }
    },
    [showDriverCode, hasDriver, onChange]
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
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#a1a1a6] transition-colors hover:bg-white/[0.08] hover:text-[#ededed]"
              title={
                showDriverCode
                  ? 'Hide driver code (show solution class only)'
                  : 'Show driver code (I/O parsing)'
              }
            >
              {showDriverCode ? (
                <EyeOff className="h-3 w-3 stroke-[1.75]" />
              ) : (
                <Eye className="h-3 w-3 stroke-[1.75]" />
              )}
              <span>{showDriverCode ? 'Hide Driver Code' : 'Show Driver Code'}</span>
            </button>

            {showDriverCode && (
              <button
                type="button"
                onClick={() => setIsDriverLocked((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  isDriverLocked
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
                title={
                  isDriverLocked
                    ? 'Driver code is read-only. Click to unlock and edit input/output parsing.'
                    : 'Driver code is editable. Click to lock.'
                }
              >
                {isDriverLocked ? (
                  <Lock className="h-3 w-3 stroke-[1.75]" />
                ) : (
                  <Unlock className="h-3 w-3 stroke-[1.75]" />
                )}
                <span>{isDriverLocked ? 'Driver Locked' : 'Driver Editable'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={editorValue}
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

      {toastMessage && (
        <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-[#161720]/95 px-3.5 py-2 text-xs text-amber-300 shadow-xl backdrop-blur-md">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
