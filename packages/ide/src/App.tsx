import {
  type CSSProperties,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AddWorkspaceModal } from "./components/AddWorkspaceModal";
import { DiagnosticsTray } from "./components/DiagnosticsTray";
import { Editor } from "./components/Editor";
import { EditorEmptyState } from "./components/EditorEmptyState";
import { FilesPanel } from "./components/FilesPanel";
import { MotdDialog } from "./components/MotdDialog";
import { PreReleaseWatermark } from "./components/PreReleaseWatermark";
import { SidebarVariantHeader } from "./components/SidebarVariantHeader";
import { StatusBar } from "./components/StatusBar";
import { Toolbar } from "./components/Toolbar";
import { UpdateAvailableDialog } from "./components/UpdateAvailableDialog";
import {
  analyzeMegaloSource,
  type CompileState,
  type SourceAnalysis,
} from "./lib/analyzeSource";
import type { AppSettings } from "./lib/appSettings";
import {
  setDiscordPresenceEnabled,
  updateDiscordPresence,
} from "./lib/discordRpc";
import {
  canNavigateFileNavBack,
  canNavigateFileNavForward,
  EMPTY_FILE_NAV,
  type FileNavEntry,
  type FileNavState,
  gametypeNavEntry,
  navigateFileNavBack,
  navigateFileNavForward,
  pushFileNavEntry,
  renameFileNavEntries,
  sourceNavEntry,
} from "./lib/fileNavigation";
import { createPlatformFileProvider } from "./lib/fileProvider";
import { resolveProgram } from "./lib/gametypeMetadata";
import {
  includeCompileFailureAnalysis,
  type MegaloIncludeFileCache,
  megaloCompileOptionsFromWorkspace,
} from "./lib/includeDiagnostics";
import { writeMccHotReloadMglo } from "./lib/mccHotReload";
import {
  appSettingsFromMegacrow,
  bootstrapMegacrowSettings,
  createWorkspaceId,
  defaultMegacrowSettings,
  type MegacrowSettings,
  mergeAppSettings,
  persistMegacrowSettings,
  type StoredWorkspace,
} from "./lib/megacrowSettings";
import { compilerSettingsFromApp } from "./lib/megaloCompilerSettings";
import type { MegaloIncludeRoot } from "./lib/megaloIncludes";
import {
  computeVariantLimitUsage,
  type GametypeSaveFormat,
  MEGACROW_BUILD_STRING,
  MEGACROW_SHOW_WATERMARK,
  type MegaloProgram,
} from "./lib/megaloShim";
import {
  initMegaloWorkerContext,
  postMegaloWorker,
  preloadMegaloWorker,
  requestCompileDownloadInWorker,
  requestDecompileInWorker,
  requestParseInWorker,
  subscribeMegaloWorker,
  syncMegaloCompilerSettings,
  syncMegaloWorkspace,
} from "./lib/megaloWorkerClient";
import {
  CURRENT_MOTD,
  recordMotdView,
  shouldShowMotdOnStartup,
} from "./lib/motd";
import { isObjectListsPath } from "./lib/objectListsPath";
import { resolveOpenablePathReference } from "./lib/openPathReference";
import { isOpfsSupported, saveGametypeToOpfs } from "./lib/opfsStorage";
import {
  gametypeSaveFileName,
  saveGametypeBytes,
  writeMgloToWorkspaceOutput,
} from "./lib/saveGametypeFile";
import { isTauriRuntime } from "./lib/tauriRuntime";
import { checkForAppUpdate, type GithubReleaseInfo } from "./lib/updateCheck";
import {
  PROBLEMS_PANE_MAX_HEIGHT,
  PROBLEMS_PANE_MIN_HEIGHT,
  useProblemsPaneHeight,
} from "./lib/useProblemsPaneHeight";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useSidebarWidth,
} from "./lib/useSidebarWidth";
import {
  VARIANT_CAPACITY_BY_MEGALO_VERSION,
  VARIANT_STORAGE_CAPACITY,
} from "./lib/variantCapacity";
import {
  resolveActiveWorkspace,
  setActiveWorkspace,
  type Workspace,
} from "./lib/workspace";
import { workspaceUnexpectedFailure } from "./lib/workspaceBase";
import { prepareWorkspaceCompileContext } from "./lib/workspaceCompileContext";
import type { MegaloHoverContext } from "./monaco/megalo-language";
import { setMegaloPathOpenHandler } from "./monaco/megalo-language";

const idleAnalysis: SourceAnalysis = {
  compileState: "idle",
  errorCount: 0,
  message: "No gametype loaded",
  byteIdentical: null,
  byteDiffCount: null,
  compiledByteLength: null,
  mgloBytes: null,
  compileTiming: null,
  diagnostics: [],
};

export function App() {
  const [megacrowSettings, setMegacrowSettings] =
    useState<MegacrowSettings | null>(null);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(
    null
  );
  const [workspacesReady, setWorkspacesReady] = useState(false);
  const [addWorkspaceOpen, setAddWorkspaceOpen] = useState(false);
  const [addWorkspaceRequired, setAddWorkspaceRequired] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null
  );
  const settings = useMemo(
    () =>
      megacrowSettings
        ? appSettingsFromMegacrow(megacrowSettings)
        : appSettingsFromMegacrow(defaultMegacrowSettings()),
    [megacrowSettings]
  );

  const applyWorkspace = useCallback((workspace: Workspace | null) => {
    setActiveWorkspace(workspace);
    setActiveWorkspaceState(workspace);
  }, []);

  const commitSettings = useCallback(
    async (next: MegacrowSettings, workspaceOverride?: Workspace | null) => {
      const normalized = next;
      setMegacrowSettings(normalized);
      const workspace =
        workspaceOverride === undefined
          ? resolveActiveWorkspace(
              normalized.workspaces,
              normalized.activeWorkspaceId
            )
          : workspaceOverride;
      applyWorkspace(workspace);
      await persistMegacrowSettings(normalized);
    },
    [applyWorkspace]
  );

  useEffect(() => {
    let cancelled = false;
    void bootstrapMegacrowSettings()
      .then(({ settings: bootstrapped, needsAddWorkspace }) => {
        if (cancelled) {
          return;
        }
        setMegacrowSettings(bootstrapped);
        applyWorkspace(
          resolveActiveWorkspace(
            bootstrapped.workspaces,
            bootstrapped.activeWorkspaceId
          )
        );
        setAddWorkspaceRequired(needsAddWorkspace);
        setAddWorkspaceOpen(needsAddWorkspace);
        setWorkspacesReady(true);
      })
      .catch((error) => {
        console.error("Failed to bootstrap MegaCrow settings:", error);
        if (!cancelled) {
          const fallback = defaultMegacrowSettings();
          setMegacrowSettings(fallback);
          applyWorkspace(null);
          setAddWorkspaceRequired(isTauriRuntime());
          setAddWorkspaceOpen(isTauriRuntime());
          setWorkspacesReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyWorkspace]);

  const [documentContent, setDocumentContent] = useState(
    "; MegaCrow — edit Megalo source and compile to .mglo\n"
  );
  const [syncRevision, setSyncRevision] = useState(0);
  const [outlineSource, setOutlineSource] = useState(documentContent);
  const [fileName, setFileName] = useState<string | null>(null);
  const [includeRoot, setIncludeRoot] = useState<MegaloIncludeRoot | null>(
    null
  );
  const [fileNav, setFileNav] = useState<FileNavState>(EMPTY_FILE_NAV);
  const suppressFileNavRef = useRef(false);
  const [includeFileCache, setIncludeFileCache] = useState<
    MegaloIncludeFileCache | undefined
  >();
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [baseProgram, setBaseProgram] = useState<MegaloProgram | null>(null);
  const [baselineSource, setBaselineSource] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SourceAnalysis>(idleAnalysis);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [opfsRevision, setOpfsRevision] = useState(0);
  const [localDiskRevision, setLocalDiskRevision] = useState(0);
  const [compiledSize, setCompiledSize] = useState<number | null>(null);
  const initialMotdOpen = shouldShowMotdOnStartup();
  const motdCountsViewRef = useRef(initialMotdOpen);
  const [motdOpen, setMotdOpen] = useState(initialMotdOpen);
  const [updateRelease, setUpdateRelease] = useState<GithubReleaseInfo | null>(
    null
  );
  const [updateOpen, setUpdateOpen] = useState(false);
  const updateCheckDoneRef = useRef(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(true);
  const editorNavigateRef = useRef<
    ((line: number, column?: number) => void) | null
  >(null);
  const getEditorSourceRef = useRef<() => string>(() => documentContent);
  const compileRunRef = useRef(0);
  const loadRunRef = useRef(0);
  const downloadRunRef = useRef(0);
  const sourceRef = useRef(documentContent);
  const compileParsingRef = useRef(false);
  const sourceLoadInProgressRef = useRef(false);
  /** Skip the next baseline-compile effect after loadMegaloSource already compiled. */
  const skipBaselineCompileRef = useRef(false);

  const resolveCompileContext = useCallback(
    async (
      text: string,
      name: string | null,
      root: MegaloIncludeRoot | null
    ) => {
      try {
        const result = await prepareWorkspaceCompileContext(
          text,
          name,
          root,
          activeWorkspace,
          {
            onStatus: (message) => {
              setCompileState("parsing");
              setAnalysis((current) => ({
                ...current,
                compileState: "parsing",
                message,
              }));
            },
          }
        );
        if (!result.ok) {
          return {
            ok: false as const,
            analysis: includeCompileFailureAnalysis(result),
          };
        }
        setAnalysis((current) =>
          current.message.startsWith("Compiling base file")
            ? {
                ...current,
                compileState: "parsing",
                message: "Compiling Megalo source…",
              }
            : current
        );
        return {
          ok: true as const,
          includeCache: result.includeCache,
          resolvedBaseProgram: result.resolvedBaseProgram,
          resolvedBaseCustomVariant: result.resolvedBaseCustomVariant,
          resolvedBaseCustomVariantMgloBytes:
            result.resolvedBaseCustomVariantMgloBytes,
          baseJitDiagnostics: result.baseJitDiagnostics,
        };
      } catch (error) {
        const failure = workspaceUnexpectedFailure(error);
        return {
          ok: false as const,
          analysis: includeCompileFailureAnalysis(failure),
        };
      }
    },
    [activeWorkspace]
  );

  const handleSettingsChange = useCallback(
    (patch: Partial<AppSettings>) => {
      if (!megacrowSettings) {
        return;
      }
      const next = mergeAppSettings(megacrowSettings, patch);
      void commitSettings(next);
    },
    [commitSettings, megacrowSettings]
  );

  const handleAddWorkspace = useCallback(() => {
    setEditingWorkspaceId(null);
    setAddWorkspaceRequired(false);
    setAddWorkspaceOpen(true);
  }, []);

  const handleEditWorkspace = useCallback((workspace: StoredWorkspace) => {
    setEditingWorkspaceId(workspace.id);
    setAddWorkspaceRequired(false);
    setAddWorkspaceOpen(true);
  }, []);

  useEffect(() => {
    preloadMegaloWorker();
  }, []);

  useEffect(() => {
    void setDiscordPresenceEnabled(settings.discordRichPresence);
  }, [settings.discordRichPresence]);

  useEffect(() => {
    syncMegaloWorkspace(activeWorkspace);
  }, [activeWorkspace]);

  // Workspace changes must drop file history (back/forward starts fresh).
  const activeWorkspaceId = activeWorkspace?.id ?? null;
  const fileNavWorkspaceIdRef = useRef<string | null>(activeWorkspaceId);
  useEffect(() => {
    if (fileNavWorkspaceIdRef.current === activeWorkspaceId) {
      return;
    }
    fileNavWorkspaceIdRef.current = activeWorkspaceId;
    suppressFileNavRef.current = false;
    setFileNav(EMPTY_FILE_NAV);
  }, [activeWorkspaceId]);

  useEffect(() => {
    void import("./lib/lspClient").then(({ lspConfigureResolveContext }) => {
      lspConfigureResolveContext({
        workspace: activeWorkspace,
        filePath: includeRoot?.absoluteFilePath ?? null,
      });
    });
  }, [activeWorkspace, includeRoot]);

  useEffect(() => {
    syncMegaloCompilerSettings(compilerSettingsFromApp(settings));
  }, [settings.gamertag, settings.compilerStrictness, settings]);

  useEffect(() => {
    if (!settings.discordRichPresence) {
      return;
    }

    const details = fileName ?? "MegaCrow";
    let state = "Editing Halo Reach gametypes";
    if (fileName) {
      if (compileState === "ok" || compileState === "warn") {
        state = compileState === "warn" ? "Compile warning" : "Script compiled";
      } else if (compileState === "error") {
        state = "Compile errors";
      } else if (compileState === "decompiling") {
        state = "Decompiling gametype";
      } else if (compileState === "parsing") {
        state = "Compiling…";
      } else {
        state = "Editing gametype";
      }
    }
    void updateDiscordPresence({ details, state });
  }, [compileState, fileName, settings.discordRichPresence]);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorLine(line);
    setCursorColumn(column);
  }, []);

  const handleRegisterNavigate = useCallback(
    (navigate: (line: number, column?: number) => void) => {
      editorNavigateRef.current = navigate;
    },
    []
  );

  const handleToggleDiagnostics = useCallback(() => {
    setDiagnosticsOpen((open) => !open);
  }, []);

  const handleNavigateToDiagnostic = useCallback(
    (line: number, column: number) => {
      editorNavigateRef.current?.(line, column);
    },
    []
  );

  const warningCount = useMemo(
    () => analysis.diagnostics.filter((d) => d.severity === "warning").length,
    [analysis.diagnostics]
  );

  const isPlainTextDocument = useMemo(
    () => isObjectListsPath(includeRoot?.absoluteFilePath ?? fileName),
    [includeRoot?.absoluteFilePath, fileName]
  );

  const handleRegisterGetValue = useCallback((getValue: () => string) => {
    getEditorSourceRef.current = getValue;
  }, []);

  const applyDocument = useCallback((text: string) => {
    setDocumentContent(text);
    setOutlineSource(text);
    sourceRef.current = text;
    setSyncRevision((n) => n + 1);
    compileParsingRef.current = false;
  }, []);

  const clearWorkspace = useCallback(() => {
    loadRunRef.current += 1;
    sourceLoadInProgressRef.current = false;
    skipBaselineCompileRef.current = false;
    suppressFileNavRef.current = false;
    setOriginalBytes(null);
    setBaseProgram(null);
    setBaselineSource(null);
    setFileName(null);
    setIncludeRoot(null);
    setIncludeFileCache(undefined);
    setDocumentContent("; Open a Reach .bin or .blf gametype to decompile\n");
    setOutlineSource("; Open a Reach .bin or .blf gametype to decompile\n");
    sourceRef.current = "; Open a Reach .bin or .blf gametype to decompile\n";
    setSyncRevision((n) => n + 1);
    compileParsingRef.current = false;
    setLoadError(null);
    setAnalysis(idleAnalysis);
    setCompileState("idle");
    setCompiledSize(null);
    setFileNav(EMPTY_FILE_NAV);
  }, []);

  const recordFileNavOpen = useCallback((entry: FileNavEntry) => {
    if (suppressFileNavRef.current) {
      return;
    }
    setFileNav((prev) => pushFileNavEntry(prev, entry, sourceRef.current));
  }, []);

  const handleSelectWorkspace = useCallback(
    (id: string) => {
      if (!megacrowSettings) {
        return;
      }
      if (megacrowSettings.activeWorkspaceId === id) {
        return;
      }
      const next = {
        ...megacrowSettings,
        activeWorkspaceId: id,
      };
      clearWorkspace();
      void commitSettings(next);
      setLocalDiskRevision((value) => value + 1);
    },
    [clearWorkspace, commitSettings, megacrowSettings]
  );

  const handleDeleteWorkspace = useCallback(
    (id: string) => {
      if (!megacrowSettings) {
        return;
      }
      const remaining = megacrowSettings.workspaces.filter(
        (workspace) => workspace.id !== id
      );
      const wasActive = megacrowSettings.activeWorkspaceId === id;
      const nextActiveId = wasActive
        ? (remaining[0]?.id ?? null)
        : megacrowSettings.activeWorkspaceId;
      const next: MegacrowSettings = {
        ...megacrowSettings,
        workspaces: remaining,
        activeWorkspaceId: nextActiveId,
      };
      if (wasActive) {
        clearWorkspace();
      }
      void commitSettings(next).then(() => {
        setLocalDiskRevision((value) => value + 1);
        if (remaining.length === 0 && isTauriRuntime()) {
          setEditingWorkspaceId(null);
          setAddWorkspaceRequired(true);
          setAddWorkspaceOpen(true);
        }
      });
    },
    [clearWorkspace, commitSettings, megacrowSettings]
  );

  const handleSaveWorkspace = useCallback(
    (draft: { name: string; inputPath: string; outputPath: string }) => {
      const base = megacrowSettings ?? defaultMegacrowSettings();
      if (editingWorkspaceId) {
        const workspaces = base.workspaces.map((workspace) =>
          workspace.id === editingWorkspaceId
            ? {
                ...workspace,
                name: draft.name,
                inputPath: draft.inputPath,
                outputPath: draft.outputPath,
              }
            : workspace
        );
        const next: MegacrowSettings = {
          ...base,
          workspaces,
        };
        const editedActive = base.activeWorkspaceId === editingWorkspaceId;
        if (editedActive) {
          clearWorkspace();
        }
        void commitSettings(next).then(() => {
          setAddWorkspaceOpen(false);
          setAddWorkspaceRequired(false);
          setEditingWorkspaceId(null);
          setLocalDiskRevision((value) => value + 1);
        });
        return;
      }
      const stored = {
        id: createWorkspaceId(),
        name: draft.name,
        megaloVersion: "107-mcc" as const,
        inputPath: draft.inputPath,
        outputPath: draft.outputPath,
      };
      const next: MegacrowSettings = {
        ...base,
        workspaces: [...base.workspaces, stored],
        activeWorkspaceId: stored.id,
      };
      clearWorkspace();
      void commitSettings(next).then(() => {
        setAddWorkspaceOpen(false);
        setAddWorkspaceRequired(false);
        setEditingWorkspaceId(null);
        setLocalDiskRevision((value) => value + 1);
      });
    },
    [clearWorkspace, commitSettings, editingWorkspaceId, megacrowSettings]
  );

  const handleFileDeleted = useCallback(
    (name: string) => {
      setOpfsRevision((n) => n + 1);
      setLocalDiskRevision((n) => n + 1);
      if (
        fileName !== null &&
        fileName.localeCompare(name, undefined, { sensitivity: "accent" }) === 0
      ) {
        clearWorkspace();
      }
    },
    [clearWorkspace, fileName]
  );

  const handleFileRenamed = useCallback(
    (oldName: string, newName: string, absoluteFilePath: string) => {
      setLocalDiskRevision((n) => n + 1);
      setFileNav((prev) =>
        renameFileNavEntries(prev, oldName, newName, absoluteFilePath)
      );
      if (
        fileName !== null &&
        fileName.localeCompare(oldName, undefined, {
          sensitivity: "accent",
        }) === 0
      ) {
        setFileName(newName);
        setIncludeRoot({ absoluteFilePath });
      }
    },
    [fileName]
  );

  const loadGametype = useCallback(
    (bytes: Uint8Array, name: string) => {
      const runId = ++loadRunRef.current;
      recordFileNavOpen(gametypeNavEntry(bytes, name));
      setLoadError(null);
      setCompileState("decompiling");
      setAnalysis({
        ...idleAnalysis,
        compileState: "decompiling",
        message: "Decompiling…",
      });

      void requestDecompileInWorker(
        bytes,
        {
          fileName: name,
          editorVersion: MEGACROW_BUILD_STRING,
        },
        runId
      ).then((result) => {
        if (runId !== loadRunRef.current) {
          return;
        }
        if (result.analysis.compileState === "error") {
          setOriginalBytes(null);
          setBaseProgram(null);
          setBaselineSource(null);
          setFileName(null);
          setIncludeRoot(null);
          setLoadError(result.analysis.message);
          setAnalysis(result.analysis);
          setCompileState("error");
          setCompiledSize(null);
          return;
        }

        const { program, source: decompiled, analysis } = result;
        setOriginalBytes(bytes);
        setBaseProgram(program);
        setBaselineSource(decompiled);
        setFileName(name);
        setIncludeRoot(null);
        applyDocument(decompiled);
        setAnalysis(analysis);
        setCompileState(analysis.compileState);
        setCompiledSize(bytes.length);
        initMegaloWorkerContext(bytes, program, decompiled);

        if (isOpfsSupported() && !isTauriRuntime()) {
          void saveGametypeToOpfs(name, bytes, decompiled).then((savedName) => {
            if (runId !== loadRunRef.current) {
              return;
            }
            setFileName(savedName);
            setOpfsRevision((n) => n + 1);
          });
        }
      });
    },
    [applyDocument, recordFileNavOpen]
  );

  const loadMegaloSource = useCallback(
    (text: string, name: string, includeRootArg?: MegaloIncludeRoot) => {
      const runId = ++loadRunRef.current;
      const plainText = isObjectListsPath(
        includeRootArg?.absoluteFilePath ?? name
      );

      recordFileNavOpen(sourceNavEntry(text, name, includeRootArg));
      applyDocument(text);
      setBaselineSource(text);
      setFileName(name);
      setIncludeRoot(includeRootArg ?? null);
      setIncludeFileCache(undefined);
      setOriginalBytes(null);
      setCompiledSize(null);
      setBaseProgram(null);
      setLoadError(null);

      if (plainText) {
        sourceLoadInProgressRef.current = false;
        skipBaselineCompileRef.current = true;
        setCompileState("idle");
        setAnalysis({
          ...idleAnalysis,
          message: "Object list (plain text)",
        });
        initMegaloWorkerContext(null, null, text);
        return;
      }

      sourceLoadInProgressRef.current = true;
      setCompileState("parsing");
      setAnalysis({
        ...idleAnalysis,
        compileState: "parsing",
        message: "Parsing Megalo source…",
      });
      initMegaloWorkerContext(null, null, text);

      void (async () => {
        const compileContext = await resolveCompileContext(
          text,
          name,
          includeRootArg ?? null
        );

        if (runId !== loadRunRef.current) {
          return;
        }

        if (!compileContext.ok) {
          sourceLoadInProgressRef.current = false;
          setIncludeFileCache(undefined);
          setBaseProgram(null);
          setLoadError(compileContext.analysis.message);
          setAnalysis(compileContext.analysis);
          setCompileState("error");
          return;
        }

        const { program, analysis } = await requestParseInWorker(text, runId, {
          includeCache: compileContext.includeCache,
          resolvedBaseProgram: compileContext.resolvedBaseProgram,
          resolvedBaseCustomVariant: compileContext.resolvedBaseCustomVariant,
          resolvedBaseCustomVariantMgloBytes:
            compileContext.resolvedBaseCustomVariantMgloBytes,
          baseJitDiagnostics: compileContext.baseJitDiagnostics,
        });

        if (runId !== loadRunRef.current) {
          return;
        }

        if (program) {
          setBaseProgram(compileContext.resolvedBaseProgram ?? program);
          setLoadError(null);
        } else {
          setBaseProgram(null);
          setLoadError(analysis.message);
        }
        setAnalysis(analysis);
        setCompileState(analysis.compileState);

        if (analysis.compileState === "error") {
          sourceLoadInProgressRef.current = false;
          return;
        }

        setIncludeFileCache(compileContext.includeCache);
        // Load already ran a full compile via requestParseInWorker.
        skipBaselineCompileRef.current = true;
        sourceLoadInProgressRef.current = false;
      })();
    },
    [applyDocument, recordFileNavOpen, resolveCompileContext]
  );

  const openFileNavEntry = useCallback(
    async (entry: FileNavEntry) => {
      suppressFileNavRef.current = true;
      try {
        if (entry.type === "gametype") {
          loadGametype(entry.bytes, entry.displayName);
          return;
        }
        if (entry.absoluteFilePath) {
          const fileProvider = createPlatformFileProvider(activeWorkspace);
          const fresh = fileProvider
            ? await fileProvider.readText(entry.absoluteFilePath)
            : null;
          if (fresh !== null) {
            loadMegaloSource(fresh, entry.displayName, {
              absoluteFilePath: entry.absoluteFilePath,
            });
            return;
          }
        }
        loadMegaloSource(
          entry.text,
          entry.displayName,
          entry.absoluteFilePath
            ? { absoluteFilePath: entry.absoluteFilePath }
            : undefined
        );
      } finally {
        queueMicrotask(() => {
          suppressFileNavRef.current = false;
        });
      }
    },
    [activeWorkspace, loadGametype, loadMegaloSource]
  );

  const handleNavigateBack = useCallback(() => {
    const result = navigateFileNavBack(fileNav, sourceRef.current);
    if (!result) {
      return;
    }
    setFileNav(result.state);
    void openFileNavEntry(result.entry);
  }, [fileNav, openFileNavEntry]);

  const handleNavigateForward = useCallback(() => {
    const result = navigateFileNavForward(fileNav, sourceRef.current);
    if (!result) {
      return;
    }
    setFileNav(result.state);
    void openFileNavEntry(result.entry);
  }, [fileNav, openFileNavEntry]);

  const handleSourceDebounced = useCallback((text: string) => {
    sourceRef.current = text;
    startTransition(() => setOutlineSource(text));
  }, []);

  const handleCompileDebounced = useCallback(
    (text: string) => {
      sourceRef.current = text;

      if (isObjectListsPath(includeRoot?.absoluteFilePath ?? fileName)) {
        return;
      }

      const isSourceOnly = originalBytes === null;
      if (!(isSourceOnly || baseProgram)) {
        return;
      }

      compileParsingRef.current = true;
      setCompileState("parsing");

      const runId = ++compileRunRef.current;

      void (async () => {
        const compileContext = await resolveCompileContext(
          text,
          fileName,
          includeRoot
        );
        if (!compileContext.ok) {
          if (runId === compileRunRef.current) {
            compileParsingRef.current = false;
            setIncludeFileCache(undefined);
            setAnalysis(compileContext.analysis);
            setCompileState("error");
          }
          return;
        }

        setIncludeFileCache(compileContext.includeCache);

        const compileOptions = megaloCompileOptionsFromWorkspace(
          activeWorkspace,
          compileContext.includeCache,
          compileContext.resolvedBaseProgram,
          compileContext.resolvedBaseCustomVariant,
          compileContext.resolvedBaseCustomVariantMgloBytes
        );

        const posted = postMegaloWorker({
          kind: "compile",
          id: runId,
          source: text,
          includeCache: compileContext.includeCache,
          resolvedBaseProgram: compileContext.resolvedBaseProgram,
          resolvedBaseCustomVariant: compileContext.resolvedBaseCustomVariant,
          resolvedBaseCustomVariantMgloBytes:
            compileContext.resolvedBaseCustomVariantMgloBytes,
          baseJitDiagnostics: compileContext.baseJitDiagnostics,
        });
        if (!posted) {
          const result = await analyzeMegaloSource(
            text,
            originalBytes,
            baseProgram,
            baselineSource,
            compileOptions,
            compileContext.includeCache,
            compilerSettingsFromApp(settings)
          );
          if (runId === compileRunRef.current && text === sourceRef.current) {
            compileParsingRef.current = false;
            setAnalysis(result);
            setCompileState(result.compileState);
          }
        }
      })();
    },
    [
      originalBytes,
      baseProgram,
      baselineSource,
      fileName,
      includeRoot,
      resolveCompileContext,
      activeWorkspace,
      settings.gamertag,
      settings.compilerStrictness,
      settings,
    ]
  );

  useEffect(() => {
    // Recompile when compiler settings change (load uses the baseline effect).
    if (isPlainTextDocument) {
      return;
    }
    if (baselineSource === null && baseProgram === null) {
      return;
    }
    if (sourceLoadInProgressRef.current) {
      return;
    }
    handleCompileDebounced(sourceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only settings should retrigger
  }, [
    isPlainTextDocument,
    handleCompileDebounced,
    baseProgram,
    baselineSource,
  ]);

  useEffect(() => {
    initMegaloWorkerContext(originalBytes, baseProgram, baselineSource);
  }, [originalBytes, baseProgram, baselineSource]);

  // Baseline analysis on load (edits use handleCompileDebounced).
  useEffect(() => {
    if (isPlainTextDocument) {
      return;
    }
    if (baselineSource === null) {
      return;
    }
    if (sourceLoadInProgressRef.current) {
      return;
    }
    if (skipBaselineCompileRef.current) {
      skipBaselineCompileRef.current = false;
      return;
    }
    if (originalBytes !== null && !baseProgram) {
      return;
    }
    if (originalBytes === null && baseProgram === null) {
      return;
    }
    const runId = ++compileRunRef.current;
    const source = sourceRef.current;

    void (async () => {
      const compileContext = await resolveCompileContext(
        source,
        fileName,
        includeRoot
      );
      if (!compileContext.ok) {
        if (runId === compileRunRef.current) {
          compileParsingRef.current = false;
          setIncludeFileCache(undefined);
          setAnalysis(compileContext.analysis);
          setCompileState("error");
        }
        return;
      }

      setIncludeFileCache(compileContext.includeCache);

      compileParsingRef.current = true;
      setCompileState("parsing");
      setAnalysis((current) => ({
        ...current,
        compileState: "parsing",
        message: "Compiling Megalo source…",
      }));

      const compileOptions = megaloCompileOptionsFromWorkspace(
        activeWorkspace,
        compileContext.includeCache,
        compileContext.resolvedBaseProgram,
        compileContext.resolvedBaseCustomVariant,
        compileContext.resolvedBaseCustomVariantMgloBytes
      );

      const posted = postMegaloWorker({
        kind: "compile",
        id: runId,
        source,
        includeCache: compileContext.includeCache,
        resolvedBaseProgram: compileContext.resolvedBaseProgram,
        resolvedBaseCustomVariant: compileContext.resolvedBaseCustomVariant,
        resolvedBaseCustomVariantMgloBytes:
          compileContext.resolvedBaseCustomVariantMgloBytes,
        baseJitDiagnostics: compileContext.baseJitDiagnostics,
      });
      if (!posted) {
        const result = await analyzeMegaloSource(
          source,
          originalBytes,
          baseProgram,
          baselineSource,
          compileOptions,
          compileContext.includeCache,
          compilerSettingsFromApp(settings)
        );
        if (runId === compileRunRef.current) {
          compileParsingRef.current = false;
          setAnalysis(result);
          setCompileState(result.compileState);
        }
        return;
      }
    })();
  }, [
    baseProgram,
    baselineSource,
    fileName,
    includeRoot,
    isPlainTextDocument,
    originalBytes,
    resolveCompileContext,
    activeWorkspace,
    settings,
  ]);

  useEffect(
    () =>
      subscribeMegaloWorker((response) => {
        if (response.kind !== "compile") {
          return;
        }
        if (response.id !== compileRunRef.current) {
          return;
        }
        compileParsingRef.current = false;
        setAnalysis(response.analysis);
        setCompileState(response.analysis.compileState);
      }),
    []
  );

  useEffect(() => {
    if (
      !settings.mccHotReload ||
      (analysis.compileState !== "ok" && analysis.compileState !== "warn") ||
      analysis.compiledByteLength === null ||
      !analysis.mgloBytes
    ) {
      return;
    }
    setCompiledSize(analysis.compiledByteLength);
    void writeMccHotReloadMglo(analysis.mgloBytes).catch((error) => {
      console.error("Failed to write MCC hot-reload .mglo:", error);
    });
  }, [analysis, settings.mccHotReload]);

  const compileDownload = useCallback(
    (format: GametypeSaveFormat) => {
      if (!baseProgram) {
        setAnalysis({
          ...idleAnalysis,
          compileState: "error",
          message: "Load a gametype or Megalo source first",
          errorCount: 1,
        });
        setCompileState("error");
        return;
      }

      const runId = ++downloadRunRef.current;
      const source = getEditorSourceRef.current();
      setCompileState("parsing");
      setAnalysis((current) => ({
        ...current,
        compileState: "parsing",
        message: "Compiling for export…",
      }));

      void (async () => {
        const compileContext = await resolveCompileContext(
          source,
          fileName,
          includeRoot
        );
        if (!compileContext.ok) {
          setIncludeFileCache(undefined);
          setAnalysis(compileContext.analysis);
          setCompileState("error");
          return;
        }

        setIncludeFileCache(compileContext.includeCache);

        const result = await requestCompileDownloadInWorker(
          source,
          runId,
          format,
          originalBytes,
          baseProgram,
          baselineSource,
          {
            includeCache: compileContext.includeCache,
            resolvedBaseProgram: compileContext.resolvedBaseProgram,
            resolvedBaseCustomVariant: compileContext.resolvedBaseCustomVariant,
            resolvedBaseCustomVariantMgloBytes:
              compileContext.resolvedBaseCustomVariantMgloBytes,
            baseJitDiagnostics: compileContext.baseJitDiagnostics,
          }
        );

        if (runId !== downloadRunRef.current) {
          return;
        }
        const { output, analysis } = result;
        if (output) {
          const downloadName = gametypeSaveFileName(fileName, format);
          const saveResult = await saveGametypeBytes(
            output,
            format,
            downloadName
          );
          if (saveResult.saved) {
            setCompiledSize(output.length);
            setAnalysis({
              ...analysis,
              message: saveResult.path
                ? `Saved to ${saveResult.path}`
                : `Saved ${downloadName} to Downloads`,
            });
          } else {
            setAnalysis({
              ...analysis,
              compileState: "idle",
              message: "Save cancelled",
            });
          }
          setCompileState(saveResult.saved ? analysis.compileState : "idle");
          return;
        }
        setAnalysis(analysis);
        setCompileState(analysis.compileState);
      })();
    },
    [
      baseProgram,
      baselineSource,
      fileName,
      includeRoot,
      originalBytes,
      resolveCompileContext,
    ]
  );

  const buildVariant = useCallback(() => {
    if (!activeWorkspace || activeWorkspace.type !== "tauri" || !fileName) {
      return;
    }

    const runId = ++downloadRunRef.current;
    const source = getEditorSourceRef.current();
    setCompileState("parsing");
    setAnalysis((current) => ({
      ...current,
      compileState: "parsing",
      message: "Building .mglo…",
    }));

    void (async () => {
      const compileContext = await resolveCompileContext(
        source,
        fileName,
        includeRoot
      );
      if (!compileContext.ok) {
        setIncludeFileCache(undefined);
        setAnalysis(compileContext.analysis);
        setCompileState("error");
        return;
      }

      setIncludeFileCache(compileContext.includeCache);

      const result = await requestCompileDownloadInWorker(
        source,
        runId,
        "mglo",
        originalBytes,
        baseProgram,
        baselineSource,
        {
          includeCache: compileContext.includeCache,
          resolvedBaseProgram: compileContext.resolvedBaseProgram,
          resolvedBaseCustomVariant: compileContext.resolvedBaseCustomVariant,
          resolvedBaseCustomVariantMgloBytes:
            compileContext.resolvedBaseCustomVariantMgloBytes,
          baseJitDiagnostics: compileContext.baseJitDiagnostics,
        }
      );

      if (runId !== downloadRunRef.current) {
        return;
      }

      const { output, analysis } = result;
      if (!output) {
        setAnalysis(analysis);
        setCompileState(analysis.compileState);
        return;
      }

      try {
        const outputPath = await writeMgloToWorkspaceOutput(
          activeWorkspace,
          fileName,
          output
        );
        setCompiledSize(output.length);
        setAnalysis({
          ...analysis,
          message: `Built ${gametypeSaveFileName(fileName, "mglo")} → ${outputPath}`,
        });
        setCompileState(analysis.compileState);
      } catch (error) {
        setAnalysis({
          ...analysis,
          compileState: "error",
          errorCount: 1,
          message: String(error),
        });
        setCompileState("error");
      }
    })();
  }, [
    activeWorkspace,
    baseProgram,
    baselineSource,
    fileName,
    includeRoot,
    originalBytes,
    resolveCompileContext,
  ]);

  const megaloVersionId = activeWorkspace?.megaloVersion ?? "107-mcc";

  const variantCapacity = activeWorkspace
    ? VARIANT_STORAGE_CAPACITY
    : VARIANT_CAPACITY_BY_MEGALO_VERSION["107-mcc"];

  const statusMessage = loadError ?? analysis.message;

  const variantBytes =
    analysis.compiledByteLength ??
    compiledSize ??
    (originalBytes === null ? null : originalBytes.length);

  const variantLimitUsage = useMemo(() => {
    const program = resolveProgram(
      outlineSource,
      baseProgram,
      baselineSource,
      includeFileCache
    );
    if (!program) {
      return null;
    }
    return computeVariantLimitUsage(program, variantBytes);
  }, [
    outlineSource,
    baseProgram,
    baselineSource,
    includeFileCache,
    variantBytes,
  ]);

  const editorHoverContext = useMemo(
    (): MegaloHoverContext => ({
      baseProgram,
      baselineSource,
      includeCache: includeFileCache,
    }),
    [baseProgram, baselineSource, includeFileCache]
  );

  useEffect(() => {
    setMegaloPathOpenHandler(async ({ kind, path }) => {
      const resolved = await resolveOpenablePathReference(kind, path, {
        workspace: activeWorkspace,
        currentFilePath: includeRoot?.absoluteFilePath ?? null,
        includeCache: includeFileCache,
      });
      if (!resolved) {
        console.warn(
          `[megacrow] could not open ${kind} path: ${path}` +
            (kind === "base" ? " (source .txt not found)" : "")
        );
        return;
      }
      loadMegaloSource(resolved.text, resolved.displayName, {
        absoluteFilePath: resolved.absoluteFilePath,
      });
    });
    return () => setMegaloPathOpenHandler(null);
  }, [activeWorkspace, includeRoot, includeFileCache, loadMegaloSource]);

  const handleMotdDismiss = () => {
    if (motdCountsViewRef.current) {
      recordMotdView(CURRENT_MOTD.id);
    }
    motdCountsViewRef.current = false;
    setMotdOpen(false);
  };

  const showMotdPreview = () => {
    motdCountsViewRef.current = false;
    setMotdOpen(true);
  };

  useEffect(() => {
    if (updateCheckDoneRef.current || !workspacesReady || !megacrowSettings) {
      return;
    }
    if (!isTauriRuntime()) {
      updateCheckDoneRef.current = true;
      return;
    }

    let cancelled = false;
    updateCheckDoneRef.current = true;
    void checkForAppUpdate({
      currentBuildString: MEGACROW_BUILD_STRING,
      skippedUpdateVersion: megacrowSettings.skippedUpdateVersion,
    }).then((result) => {
      if (cancelled || result.kind !== "available") {
        return;
      }
      setUpdateRelease(result.release);
    });

    return () => {
      cancelled = true;
    };
  }, [megacrowSettings, workspacesReady]);

  useEffect(() => {
    if (!updateRelease || motdOpen) {
      setUpdateOpen(false);
      return;
    }
    setUpdateOpen(true);
  }, [motdOpen, updateRelease]);

  const handleUpdateDismiss = useCallback(() => {
    setUpdateOpen(false);
    setUpdateRelease(null);
  }, []);

  const handleUpdateSkip = useCallback(() => {
    if (!(megacrowSettings && updateRelease)) {
      setUpdateOpen(false);
      setUpdateRelease(null);
      return;
    }
    const next = mergeAppSettings(megacrowSettings, {
      skippedUpdateVersion: updateRelease.tagName,
    });
    setUpdateOpen(false);
    setUpdateRelease(null);
    void commitSettings(next);
  }, [commitSettings, megacrowSettings, updateRelease]);

  const {
    width: sidebarWidth,
    open: sidebarOpen,
    toggleOpen: toggleSidebar,
    onResizeStart: onSidebarResizeStart,
  } = useSidebarWidth();
  const {
    height: problemsPaneHeight,
    onResizeStart: onProblemsPaneResizeStart,
  } = useProblemsPaneHeight();

  return (
    <div className="app">
      <MotdDialog onDismiss={handleMotdDismiss} open={motdOpen} />
      <UpdateAvailableDialog
        currentBuildString={MEGACROW_BUILD_STRING}
        onDismiss={handleUpdateDismiss}
        onSkip={handleUpdateSkip}
        open={updateOpen}
        release={updateRelease}
      />
      <AddWorkspaceModal
        initialWorkspace={
          editingWorkspaceId
            ? (megacrowSettings?.workspaces.find(
                (workspace) => workspace.id === editingWorkspaceId
              ) ?? null)
            : null
        }
        onCancel={
          addWorkspaceRequired
            ? undefined
            : () => {
                setAddWorkspaceOpen(false);
                setEditingWorkspaceId(null);
              }
        }
        onSave={handleSaveWorkspace}
        open={addWorkspaceOpen && workspacesReady}
        required={addWorkspaceRequired}
      />
      <Toolbar
        canBuild={
          !!fileName &&
          activeWorkspace?.type === "tauri" &&
          !isPlainTextDocument
        }
        canExport={!isPlainTextDocument}
        canNavigateBack={canNavigateFileNavBack(fileNav)}
        canNavigateForward={canNavigateFileNavForward(fileNav)}
        fileName={fileName}
        onBuild={buildVariant}
        onCompile={compileDownload}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        onSettingsChange={handleSettingsChange}
        onShowMotd={showMotdPreview}
        onToggleSidebar={toggleSidebar}
        settings={settings}
        sidebarOpen={sidebarOpen}
        workspace={activeWorkspace}
      />
      <div
        className={`main${sidebarOpen ? "" : " main--sidebar-collapsed"}`}
        style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
      >
        <aside
          aria-hidden={!sidebarOpen}
          className="sidebar"
          inert={sidebarOpen ? undefined : true}
        >
          <SidebarVariantHeader
            baselineSource={baselineSource}
            baseProgram={baseProgram}
            compiledMetadata={analysis.compiledMetadata}
            fileBytes={originalBytes}
            fileName={fileName}
            includeCache={includeFileCache}
            source={outlineSource}
          />
          <div className="sidebar-body">
            <FilesPanel
              activeFileName={fileName}
              localDiskRevision={localDiskRevision}
              onAddWorkspace={handleAddWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onEditWorkspace={handleEditWorkspace}
              onFileDeleted={handleFileDeleted}
              onFileRenamed={handleFileRenamed}
              onOpenFile={loadGametype}
              onOpenSource={loadMegaloSource}
              onSelectWorkspace={handleSelectWorkspace}
              opfsRevision={opfsRevision}
              workspace={activeWorkspace}
              workspaceSwitcher={isTauriRuntime()}
              workspaces={megacrowSettings?.workspaces ?? []}
            />
          </div>
        </aside>
        <div
          aria-hidden={!sidebarOpen}
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuenow={sidebarWidth}
          className="sidebar-resizer"
          inert={sidebarOpen ? undefined : true}
          onPointerDown={sidebarOpen ? onSidebarResizeStart : undefined}
          role="separator"
        />
        <section className="editor-pane">
          <div className="editor-pane-main">
            {MEGACROW_SHOW_WATERMARK ? <PreReleaseWatermark /> : null}
            {fileName ? (
              <Editor
                diagnostics={isPlainTextDocument ? [] : analysis.diagnostics}
                documentContent={documentContent}
                editorTheme={settings.editorTheme}
                foldKey={fileName}
                hoverContext={editorHoverContext}
                onCompileDebounced={
                  isPlainTextDocument ? undefined : handleCompileDebounced
                }
                onCursorChange={handleCursorChange}
                onRegisterGetValue={handleRegisterGetValue}
                onRegisterNavigate={handleRegisterNavigate}
                onSourceDebounced={handleSourceDebounced}
                plainText={isPlainTextDocument}
                syncRevision={syncRevision}
              />
            ) : (
              <EditorEmptyState />
            )}
          </div>
          {fileName && diagnosticsOpen && (
            <>
              <div
                aria-label="Resize problems pane"
                aria-orientation="horizontal"
                aria-valuemax={PROBLEMS_PANE_MAX_HEIGHT}
                aria-valuemin={PROBLEMS_PANE_MIN_HEIGHT}
                aria-valuenow={problemsPaneHeight}
                className="problems-pane-resizer"
                onPointerDown={onProblemsPaneResizeStart}
                role="separator"
              />
              <DiagnosticsTray
                diagnostics={analysis.diagnostics}
                height={problemsPaneHeight}
                onClose={() => setDiagnosticsOpen(false)}
                onNavigate={handleNavigateToDiagnostic}
              />
            </>
          )}
        </section>
      </div>
      <StatusBar
        byteDiffCount={analysis.byteDiffCount}
        byteIdentical={analysis.byteIdentical}
        column={cursorColumn}
        compileState={compileState}
        diagnosticsOpen={diagnosticsOpen}
        errorCount={analysis.errorCount}
        line={cursorLine}
        megaCrowVersion={MEGACROW_BUILD_STRING}
        megaloVersionId={megaloVersionId}
        message={statusMessage}
        onToggleDiagnostics={handleToggleDiagnostics}
        variantBytes={variantBytes}
        variantCapacity={variantCapacity}
        variantLimitUsage={variantLimitUsage}
        warningCount={warningCount}
      />
    </div>
  );
}
