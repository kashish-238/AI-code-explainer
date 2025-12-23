"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";

type Marker = {
  line: number;
  message: string;
  severity: "warning" | "info";
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: string;
  markers?: Marker[];
};

export default function CodeEditor({
  value,
  onChange,
  language,
  markers = [],
}: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.updateOptions({
      fontSize: 14,
      fontFamily: "JetBrains Mono, monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });
  };

  // 🔴 APPLY RED SQUIGGLY MARKERS (CORRECTLY)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const maxLine = model.getLineCount();

    const monacoMarkers: monaco.editor.IMarkerData[] = markers
      .filter((m) => m.line >= 1 && m.line <= maxLine)
      .map((m) => {
        const maxCol = model.getLineMaxColumn(m.line);

        return {
          startLineNumber: m.line,
          endLineNumber: m.line,
          startColumn: 1,
          endColumn: maxCol, // ✅ REQUIRED or marker is ignored
          message: m.message,
          severity:
            m.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        };
      });

    monacoRef.current.editor.setModelMarkers(
      model,
      "mistake-detector",
      monacoMarkers
    );
  }, [markers]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
    />
  );
}
