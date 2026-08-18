import Editor, { type Monaco } from "@monaco-editor/react";
import { memo, useCallback, useEffect, useRef } from "react";
import { megaloDiagnosticFromLsp } from "../lib/diagnostics";
import {
  EDITOR_FONT_FAMILY,
  EDITOR_FONT_SIZE,
  EDITOR_LINE_HEIGHT,
} from "../lib/editorFont";
import { lspSyncDocument, subscribeLspDiagnostics } from "../lib/lspClient";
import {
  showCommandPalette,
  showSourceFileQuickOpen,
} from "../lib/sourceFileQuickOpen";
import { useT } from "../localization";
import {
  clearActiveMegaloEditor,
  MEGALO_LANGUAGE_ID,
  type MegaloDiagnostic,
  registerMegaloLanguage,
  setActiveMegaloEditor,
  setMegaloDiagnostics,
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
  /** Wrap long lines when true; horizontal scroll when false. */
  editorWordWrap?: boolean;
  onCompileDebounced?: (source: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onEditorWordWrapChange?: (wordWrap: boolean) => void;
  onRegisterGetValue?: (getValue: () => string) => void;
  onRegisterNavigate?: (
    navigate: (line: number, column?: number) => void
  ) => void;
  onSourceDebounced?: (source: string) => void;
  /** Object lists and other non-Megalo text — no compile / LSP. */
  plainText?: boolean;
  /** When true, the buffer cannot be edited (e.g. browser bundled object lists). */
  readOnly?: boolean;
  /** Bumps on load to push documentContent into the model without remounting. */
  syncRevision: number;
}

const OUTLINE_DEBOUNCE_MS = 300;
const COMPILE_DEBOUNCE_MS = 400;
const CURSOR_DEBOUNCE_MS = 120;

interface ModelContentChange {
  rangeLength: number;
  text: string;
}

interface ModelContentChangedEvent {
  changes: readonly ModelContentChange[];
}

export const MegaloEditor = memo(function MegaloEditor({
  documentContent,
  syncRevision,
  onSourceDebounced,
  onCompileDebounced,
  onRegisterGetValue,
  diagnostics = [],
  onCursorChange,
  onRegisterNavigate,
  plainText = false,
  readOnly = false,
  editorTheme = DEFAULT_EDITOR_THEME_ID,
  editorWordWrap = true,
  onEditorWordWrapChange,
}: Props) {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const editorRef = useRef<Monaco["editor"]["IStandaloneCodeEditor"] | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);
  const editorThemeRef = useRef(editorTheme);
  editorThemeRef.current = editorTheme;
  const editorWordWrapRef = useRef(editorWordWrap);
  editorWordWrapRef.current = editorWordWrap;
  const onEditorWordWrapChangeRef = useRef(onEditorWordWrapChange);
  onEditorWordWrapChangeRef.current = onEditorWordWrapChange;
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
  }, [plainText]);

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
    editorRef.current?.updateOptions({
      wordWrap: editorWordWrap ? "on" : "off",
    });
  }, [editorWordWrap]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

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
      const mapped: MegaloDiagnostic[] = lspDiags.map((d) =>
        megaloDiagnosticFromLsp(d)
      );
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
      if (!plainTextRef.current) {
        setActiveMegaloEditor(editor);
      }
      editor.onDidDispose(() => {
        clearActiveMegaloEditor(editor);
      });
      applyEditorTheme(monaco, editorThemeRef.current);

      // Ctrl/Cmd+P, Shift+P, and F1 are handled app-wide (printShortcut → IdePalette).
      editor.addAction({
        id: "megacrow.goToFile",
        label: tRef.current("editor_command_go_to_file"),
        run: () => {
          showSourceFileQuickOpen(editor);
        },
      });

      editor.addAction({
        id: "megacrow.commandPalette",
        label: tRef.current("editor_command_show_all_commands"),
        run: () => {
          showCommandPalette(editor);
        },
      });

      editor.addAction({
        id: "megacrow.toggleWordWrap",
        label: tRef.current("editor_command_toggle_word_wrap"),
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
        run: () => {
          const next = !editorWordWrapRef.current;
          editor.updateOptions({ wordWrap: next ? "on" : "off" });
          onEditorWordWrapChangeRef.current?.(next);
        },
      });

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

      model?.onDidChangeContent((event: ModelContentChangedEvent) => {
        if (suppressContentHandlerRef.current) {
          return;
        }
        scheduleOutlineSync();
        scheduleCompileSync();
        if (!plainTextRef.current) {
          void lspSyncDocument(editor.getModel()?.getValue() ?? "");
          // Space-separated Megalo slots: reopen suggest after space / `.` / `_`,
          // and after backspace/delete when a non-whitespace prefix remains
          // (Monaco only auto-triggers on typed chars).
          const hasMultilineInsert = event.changes.some(
            (change: ModelContentChange) =>
              change.text.includes("\n") || change.text.includes("\r")
          );
          let deletionShouldRetrigger = false;
          const shouldRetriggerSuggest =
            !hasMultilineInsert &&
            event.changes.some((change: ModelContentChange) => {
              if (
                change.text === " " ||
                change.text === "." ||
                change.text === "_"
              ) {
                return true;
              }
              if (change.text === "" && change.rangeLength > 0) {
                deletionShouldRetrigger = true;
                return true;
              }
              return false;
            });
          if (shouldRetriggerSuggest) {
            queueMicrotask(() => {
              if (editorRef.current !== editor) {
                return;
              }
              if (deletionShouldRetrigger) {
                const model = editor.getModel();
                const position = editor.getPosition();
                if (model === null || position === null) {
                  return;
                }
                const before = model
                  .getLineContent(position.lineNumber)
                  .slice(0, position.column - 1);
                // Only reopen while mid-identifier. After whitespace, `"`, or
                // other completed tokens, leave suggest closed.
                if (!/[A-Za-z0-9_]$/.test(before)) {
                  return;
                }
              }
              editor.trigger("megacrow", "editor.action.triggerSuggest", {
                // Ambient mode: hide when empty / don't flash Loading…
                auto: true,
              });
            });
          }
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
        wordWrap: editorWordWrap ? "on" : "off",
        readOnly,
        scrollBeyondLastLine: false,
        padding: { top: 10, bottom: 8 },
        // Keep suggest/hover widgets from being clipped by the problems pane.
        fixedOverflowWidgets: true,
        folding: true,
        showFoldingControls: "mouseover",
        "semanticHighlighting.enabled": true,
        insertSpaces: false,
        tabSize: 4,
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: false,
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
