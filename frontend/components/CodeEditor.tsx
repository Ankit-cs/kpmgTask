// @ts-nocheck
"use client";

import React from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: "vs-dark" | "light";
  readOnly?: boolean;
}

export function CodeEditor({
  code,
  onChange,
  language = "cpp",
  theme = "vs-dark",
  readOnly = false,
}: CodeEditorProps) {
  const monaco = useMonaco();

  const handleEditorMount = (editor: any) => {
    editor.focus();
  };

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        event.reason.name === 'Canceled' ||
        (event.reason && event.reason.type === 'cancelation' && event.reason.msg === 'operation is manually canceled')
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-transparent">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={code}
        onChange={onChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          lineNumbersMinChars: 3,
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
      />
    </div>
  );
}
