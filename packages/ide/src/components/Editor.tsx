import Editor, { type Monaco } from "@monaco-editor/react";
import { memo, useCallback, useEffect, useRef } from "react";
import {
  EDITOR_FONT_FAMILY,
  EDITOR_FONT_SIZE,
  EDITOR_LINE_HEIGHT,
} from "../lib/editorFont";
import { lspSyncDocument, subscribeLspDiagnostics } from "../lib/lspClient";
import {
  foldStringTables,
  MEGALO_LANGUAGE_ID,
  type MegaloDiagnostic,
  type MegaloHoverContext,
  registerMegaloLanguage,
  setMegaloDiagnostics,
  setMegaloHoverContext,
} from "../monaco/megalo-language";
import {
  applyEditorTheme,
  DEFAULT_EDITOR_THEME_ID,
  MEGALO_THEME_ID,
} from "../monaco/theme";

interface Props {
  diagnostics?: MegaloDiagnostic[];
  /** Document text when the editor mounts or when syncRevision bumps. */
  documentContent: string;
  /** monaco-themes id (e.g. github-dark). */
  editorTheme?: string;
  /** Changes when a new file is loaded; remounts the editor. */
  foldKey?: string | null;
  hoverContext?: MegaloHoverContext;
  onCompileDebounced?: (source: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onRegisterGetValue?: (getValue: () => string) => void;
  onRegisterNavigate?: (
    navigate: (line: number, column?: number) => void
  ) => void;
  onSourceDebounced?: (source: string) => void;
  /** Object lists and other non-Megalo text — no compile / LSP. */
  plainText?: boolean;
  /** Bumps on load to push documentContent into the model without remounting. */
  syncRevision: number;
}

const OUTLINE_DEBOUNCE_MS = 300;
const COMPILE_DEBOUNCE_MS = 400;
const CURSOR_DEBOUNCE_MS = 120;

export const MegaloEditor = memo(function MegaloEditor({
  documentContent,
  syncRevision,
  onSourceDebounced,
  onCompileDebounced,
  onRegisterGetValue,
  diagnostics = [],
  onCursorChange,
  onRegisterNavigate,
  foldKey,
  hoverContext,
  plainText = false,
  editorTheme = DEFAULT_EDITOR_THEME_ID,
}: Props) {
  const editorRef = useRef<Monaco["editor"]["IStandaloneCodeEditor"] | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);
  const editorThemeRef = useRef(editorTheme);
  editorThemeRef.current = editorTheme;
  const foldedForKeyRef = useRef<string | null>(null);
  const foldRunRef = useRef(0);
  const outlineSyncTimerRef = useRef<number | null>(null);
  const compileSyncTimerRef = useRef<number | null>(null);
  const cursorTimerRef = useRef<number | null>(null);
  const suppressContentHandlerRef = useRef(false);
  const lastSyncRevisionRef = useRef(-1);
  const documentContentRef = useRef(documentContent);
  const syncRevisionRef = useRef(syncRevision);
  documentContentRef.current = documentContent;
  syncRevisionRef.current = syncRevision;
  const onSourceDebouncedRef = useRef(onSourceDebounced);
  const onCompileDebouncedRef = useRef(onCompileDebounced);
  const plainTextRef = useRef(plainText);
  onSourceDebouncedRef.current = onSourceDebounced;
  onCompileDebouncedRef.current = onCompileDebounced;
  plainTextRef.current = plainText;

  const clearPendingSyncTimers = useCallback(() => {
    if (outlineSyncTimerRef.current !== null) {
      window.clearTimeout(outlineSyncTimerRef.current);
      outlineSyncTimerRef.current = null;
    }
    if (compileSyncTimerRef.current !== null) {
      window.clearTimeout(compileSyncTimerRef.current);
      compileSyncTimerRef.current = null;
    }
  }, []);

  const scheduleOutlineSync = useCallback(() => {
    if (!onSourceDebouncedRef.current) {
      return;
    }
    if (outlineSyncTimerRef.current !== null) {
      window.clearTimeout(outlineSyncTimerRef.current);
    }
    outlineSyncTimerRef.current = window.setTimeout(() => {
      outlineSyncTimerRef.current = null;
      const text = editorRef.current?.getModel()?.getValue() ?? "";
      onSourceDebouncedRef.current?.(text);
    }, OUTLINE_DEBOUNCE_MS);
  }, []);

  const scheduleCompileSync = useCallback(() => {
    if (!onCompileDebouncedRef.current) {
      return;
    }
    if (compileSyncTimerRef.current !== null) {
      window.clearTimeout(compileSyncTimerRef.current);
    }
    compileSyncTimerRef.current = window.setTimeout(() => {
      compileSyncTimerRef.current = null;
      const text = editorRef.current?.getModel()?.getValue() ?? "";
      onCompileDebouncedRef.current?.(text);
    }, COMPILE_DEBOUNCE_MS);
  }, []);

  const scheduleFoldStringTables = useCallback(() => {
    if (
      plainTextRef.current ||
      !foldKey ||
      foldedForKeyRef.current === foldKey
    ) {
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const runId = ++foldRunRef.current;
    const attemptFold = async () => {
      const currentEditor = editorRef.current;
      const currentModel = currentEditor?.getModel();
      if (
        runId !== foldRunRef.current ||
        foldedForKeyRef.current === foldKey ||
        !currentModel?.getValue().includes("string_table")
      ) {
        return;
      }
      const folded = await foldStringTables(currentEditor!);
      if (folded && runId === foldRunRef.current) {
        foldedForKeyRef.current = foldKey;
      }
    };

    const runWhenIdle = () => {
      void attemptFold();
    };

    const schedule =
      typeof window.requestIdleCallback === "function"
        ? () => window.requestIdleCallback(runWhenIdle, { timeout: 2500 })
        : () => setTimeout(runWhenIdle, 800);
    schedule();
  }, [foldKey]);

  useEffect(() => {
    setMegaloHoverContext(
      hoverContext ?? { baseProgram: null, baselineSource: null }
    );
  }, [hoverContext]);

  useEffect(
    () => () => {
      clearPendingSyncTimers();
      if (cursorTimerRef.current !== null) {
        window.clearTimeout(cursorTimerRef.current);
      }
    },
    [clearPendingSyncTimers]
  );

  const applyDocumentToModel = useCallback(() => {
    if (syncRevisionRef.current === lastSyncRevisionRef.current) {
      return;
    }

    const editor = editorRef.current;
    const model = editor?.getModel();
    const content = documentContentRef.current;
    if (!(editor && model)) {
      return;
    }

    lastSyncRevisionRef.current = syncRevisionRef.current;

    clearPendingSyncTimers();

    if (model.getValue() === content) {
      return;
    }

    suppressContentHandlerRef.current = true;
    try {
      model.setValue(content);
      editor.setPosition({ lineNumber: 1, column: 1 });
      editor.setScrollTop(0);
    } finally {
      suppressContentHandlerRef.current = false;
    }
  }, [clearPendingSyncTimers]);

  useEffect(() => {
    foldedForKeyRef.current = null;
    foldRunRef.current += 1;
  }, [foldKey]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!(monaco && model)) {
      return;
    }

    const languageId = plainText ? "plaintext" : MEGALO_LANGUAGE_ID;
    if (model.getLanguageId() !== languageId) {
      monaco.editor.setModelLanguage(model, languageId);
    }

    if (plainText) {
      monaco.editor.setModelMarkers(model, "megalo", []);
    }
  }, [plainText]);

  useEffect(() => {
    if (plainText) {
      return;
    }
    if (foldKey == null) {
      foldedForKeyRef.current = null;
      return;
    }
    if (foldedForKeyRef.current === foldKey) {
      return;
    }
    if (!documentContent.includes("string_table")) {
      return;
    }
    scheduleFoldStringTables();
  }, [documentContent, foldKey, plainText, scheduleFoldStringTables]);

  useEffect(() => {
    applyDocumentToModel();
  }, [applyDocumentToModel, syncRevision]);

  const diagnosticsRef = useRef(diagnostics);
  diagnosticsRef.current = diagnostics;

  const applyDiagnostics = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!(editor && monaco && model)) {
      return;
    }
    if (plainTextRef.current) {
      monaco.editor.setModelMarkers(model, "megalo", []);
      return;
    }
    setMegaloDiagnostics(monaco, model, diagnosticsRef.current);
  }, []);

  useEffect(() => {
    applyDiagnostics();
  }, [applyDiagnostics, diagnostics]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) {
      return;
    }
    applyEditorTheme(monaco, editorTheme);
  }, [editorTheme]);

  useEffect(() => {
    if (plainText) {
      return;
    }
    const unsubscribe = subscribeLspDiagnostics((lspDiags) => {
      const monaco = monacoRef.current;
      const model = editorRef.current?.getModel();
      if (!(monaco && model)) {
        return;
      }
      const mapped: MegaloDiagnostic[] = lspDiags.map((d) => ({
        line: d.range.start.line + 1,
        column: d.range.start.character + 1,
        endColumn: d.range.end.character + 1,
        message: d.message,
        severity: d.severity === 1 ? "error" : "warning",
      }));
      setMegaloDiagnostics(monaco, model, mapped);
    });
    return unsubscribe;
  }, [plainText]);

  useEffect(() => {
    if (plainText) {
      return;
    }
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    void lspSyncDocument(editor.getModel()?.getValue() ?? documentContent);
  }, [documentContent, plainText]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    registerMegaloLanguage(monaco);
  }, []);

  const handleMount = useCallback(
    (editor: Monaco["editor"]["IStandaloneCodeEditor"], monaco: Monaco) => {
      // Re-register feature providers after mount (covers HMR / late loads).
      registerMegaloLanguage(monaco);
      editorRef.current = editor;
      monacoRef.current = monaco;
      applyEditorTheme(monaco, editorThemeRef.current);

      // Ctrl/Cmd+Shift+P → Monaco command palette (print is blocked app-wide).
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        () => {
          editor.focus();
          editor.trigger("keyboard", "editor.action.quickCommand", null);
        }
      );

      const model = editor.getModel();
      const languageId = plainTextRef.current
        ? "plaintext"
        : MEGALO_LANGUAGE_ID;
      if (model && model.getLanguageId() !== languageId) {
        monaco.editor.setModelLanguage(model, languageId);
      }

      onRegisterGetValue?.(
        () => editorRef.current?.getModel()?.getValue() ?? ""
      );

      editor.onDidChangeCursorPosition(
        (event: Monaco["editor"]["ICursorPositionChangedEvent"]) => {
          if (!onCursorChange) {
            return;
          }
          if (cursorTimerRef.current !== null) {
            window.clearTimeout(cursorTimerRef.current);
          }
          const { lineNumber, column } = event.position;
          cursorTimerRef.current = window.setTimeout(() => {
            cursorTimerRef.current = null;
            onCursorChange(lineNumber, column);
          }, CURSOR_DEBOUNCE_MS);
        }
      );

      onRegisterNavigate?.((line, column = 1) => {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: Math.max(1, column) });
        editor.focus();
      });

      model?.onDidChangeContent(() => {
        if (suppressContentHandlerRef.current) {
          return;
        }
        scheduleOutlineSync();
        scheduleCompileSync();
        if (!plainTextRef.current) {
          void lspSyncDocument(editor.getModel()?.getValue() ?? "");
        }
      });
      applyDiagnostics();
      applyDocumentToModel();
    },
    [
      applyDocumentToModel,
      onCursorChange,
      onRegisterGetValue,
      onRegisterNavigate,
      scheduleCompileSync,
      scheduleOutlineSync,
      applyDiagnostics,
    ]
  );

  return (
    <Editor
      beforeMount={handleBeforeMount}
      defaultValue={documentContent}
      height="100%"
      language={plainText ? "plaintext" : MEGALO_LANGUAGE_ID}
      onMount={handleMount}
      options={{
        fontFamily: EDITOR_FONT_FAMILY,
        fontSize: EDITOR_FONT_SIZE,
        lineHeight: EDITOR_LINE_HEIGHT,
        fontLigatures: false,
        disableMonospaceOptimizations: true,
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
        padding: { top: 10, bottom: 8 },
        folding: true,
        showFoldingControls: "mouseover",
        "semanticHighlighting.enabled": true,
        insertSpaces: false,
        tabSize: 4,
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        quickSuggestionsDelay: 0,
        wordBasedSuggestions: "off",
        suggest: {
          showKeywords: true,
          showSnippets: false,
          preview: false,
          filterGraceful: true,
          matchOnWordStartOnly: false,
          selectionMode: "always",
          snippetsPreventQuickSuggestions: false,
          localityBonus: false,
        },
        links: true,
      }}
      theme={MEGALO_THEME_ID}
    />
  );
});

export { MegaloEditor as Editor };
