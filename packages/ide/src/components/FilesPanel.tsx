import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { writeClipboardText } from "../lib/clipboard";
import { readTextFileBlob } from "../lib/decodeTextFile";
import {
  type FileClipboardPayload,
  readFileClipboard,
  writeFileClipboard,
} from "../lib/fileClipboard";
import {
  formatLocalDiskPath,
  type LocalDiskNode,
  pathKey,
} from "../lib/localFolder";
import type { StoredWorkspace } from "../lib/megacrowSettings";
import type { MegaloIncludeRoot } from "../lib/megaloIncludes";
import {
  createOpfsGametype,
  deleteOpfsGametype,
  duplicateOpfsGametype,
  getOpfsGametypeClipboardFiles,
  isOpfsSupported,
  listOpfsGametypes,
  type OpfsGametypeEntry,
  opfsGametypeLogicalPath,
  readOpfsGametypeSource,
  renameOpfsGametype,
} from "../lib/opfsStorage";
import { revealInFileManager } from "../lib/revealInFileManager";
import {
  flattenSourceFileNodes,
  setSourceFileQuickOpenEntries,
} from "../lib/sourceFileQuickOpen";
import {
  createSystemMegaloDirectory,
  createSystemMegaloTextFile,
  deleteSystemMegaloFile,
  duplicateSystemMegaloFile,
  isSystemFolderSupported,
  type LocalDiskRoot,
  listSystemBuildOutputs,
  listSystemMegaloTree,
  moveSystemMegaloEntry,
  readSystemMegaloFile,
  renameSystemMegaloFile,
  resolveSystemMegaloFilePath,
  systemFolderLabel,
} from "../lib/systemFiles";
import type { BuildOutputEntry } from "../lib/tauriDisk";
import { isTauriRuntime } from "../lib/tauriRuntime";
import {
  BUILDS_PANE_MAX_HEIGHT,
  BUILDS_PANE_MIN_HEIGHT,
  useBuildsPaneHeight,
} from "../lib/useBuildsPaneHeight";
import { watchWorkspaceInput } from "../lib/watchWorkspaceInput";
import type { Workspace } from "../lib/workspace";
import {
  defaultObjectListText,
  findLocalDiskNode,
  loadWorkspaceObjectLists,
  objectListsFolderIsEmpty,
} from "../lib/workspaceObjectLists";
import { useT } from "../localization";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ConfirmReplaceDialog } from "./ConfirmReplaceDialog";
import {
  FilesContextMenu,
  type FilesContextMenuState,
  type FilesContextSource,
  type FilesContextTarget,
} from "./FilesContextMenu";
import { FilesRenameInput } from "./FilesRenameInput";
import {
  isMegacrowTreeDragActive,
  LocalDiskTree,
  MEGACROW_TREE_PATH_MIME,
  pruneNestedPaths,
} from "./LocalDiskTree";
import { WorkspaceMenu } from "./WorkspaceMenu";

interface Props {
  activeFileName: string | null;
  localDiskRevision: number;
  /** Filenames recognized under object_lists/ for the active Megalo version. */
  objectListNames?: readonly string[];
  onAddWorkspace?: () => void;
  /** Clear the editor back to the empty “Open a file” state. */
  onClearEditor?: () => void;
  onDeleteWorkspace?: (id: string) => void;
  onEditWorkspace?: (workspace: StoredWorkspace) => void;
  onFileDeleted: (name: string) => void;
  onFileRenamed: (
    oldName: string,
    newName: string,
    absoluteFilePath: string
  ) => void;
  /** Recognized list filenames missing when the workspace partially provides object lists. */
  onMissingObjectListNamesChange?: (names: readonly string[]) => void;
  onOpenSource: (
    source: string,
    name: string,
    includeRoot?: MegaloIncludeRoot
  ) => void;
  onSelectWorkspace?: (id: string) => void;
  /** Workspace object lists loaded from disk (`null` → use bundled defaults). */
  onWorkspaceObjectListsChange?: (
    lists: import("@megacrow/megalo").ObjectLists | null
  ) => void;
  opfsRevision: number;
  workspace: Workspace | null;
  workspaceSwitcher?: boolean;
  workspaces?: StoredWorkspace[];
}

function FileGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="files-glyph files-glyph--source"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 1.5h6l3 3V14.5h-9z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M9.5 1.5V4.5H12.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M5.5 7.5h5M5.5 9.5h5M5.5 11.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** Compiled .mglo / .bin / .blf — document with binary blocks. */
function BuiltGametypeGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="files-glyph files-glyph--built"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 1.5h6l3 3V14.5h-9z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M9.5 1.5V4.5H12.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <rect
        fill="currentColor"
        height="2"
        rx="0.3"
        width="2"
        x="5.25"
        y="7.25"
      />
      <rect
        fill="currentColor"
        height="2"
        rx="0.3"
        width="2"
        x="8.25"
        y="7.25"
      />
      <rect
        fill="currentColor"
        height="2"
        rx="0.3"
        width="2"
        x="5.25"
        y="10.25"
      />
      <rect
        fill="currentColor"
        height="2"
        rx="0.3"
        width="2"
        x="8.25"
        y="10.25"
      />
    </svg>
  );
}

function NewFileGlyph() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M3.5 1.5h6l3 3V14.5h-9z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M9.5 1.5V4.5H12.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M8 7.5v4M6 9.5h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function NewFolderGlyph() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M1.5 3.5h4l1.2 1.2H14.5v8.3H1.5z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M8 7.25v4M6 9.25h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function FilesPanel({
  workspace,
  workspaces = [],
  onSelectWorkspace,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  workspaceSwitcher = false,
  onOpenSource,
  onFileDeleted,
  onFileRenamed,
  activeFileName,
  objectListNames = [],
  onWorkspaceObjectListsChange,
  onMissingObjectListNamesChange,
  onClearEditor,
  opfsRevision,
  localDiskRevision,
}: Props) {
  const t = useT();
  const [opfsFiles, setOpfsFiles] = useState<OpfsGametypeEntry[]>([]);
  const [opfsError, setOpfsError] = useState<string | null>(null);
  const [localTree, setLocalTree] = useState<LocalDiskNode[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [buildOutputs, setBuildOutputs] = useState<BuildOutputEntry[]>([]);
  const [buildsError, setBuildsError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<FilesContextMenuState | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<{
    paths: string[][];
    source: FilesContextSource;
    targets: FilesContextTarget[];
  } | null>(null);
  const [pendingReplace, setPendingReplace] = useState<{
    displayName: string;
    fromPath: string[];
    remaining: string[][];
    targetKind: "file" | "directory";
    toParentPath: string[];
  } | null>(null);
  const [renamingPathKey, setRenamingPathKey] = useState<string | null>(null);
  const [renamingOpfsName, setRenamingOpfsName] = useState<string | null>(null);
  const [ensureExpandedKeys, setEnsureExpandedKeys] = useState<string[]>([]);
  const [pastePayload, setPastePayload] = useState<FileClipboardPayload | null>(
    null
  );
  const lastObjectListsJsonRef = useRef<string>("");
  /** Guards async tree loads from applying after a workspace switch. */
  const localRootPathRef = useRef<string | null>(null);

  const localRootPath =
    workspace?.type === "tauri" ? workspace.inputPath : null;
  const localRoot: LocalDiskRoot | null = localRootPath
    ? { path: localRootPath }
    : null;
  localRootPathRef.current = localRootPath;
  const {
    height: buildsHeight,
    open: buildsOpen,
    onResizeStart: onBuildsResizeStart,
    toggleOpen: toggleBuildsOpen,
  } = useBuildsPaneHeight();

  const opfsAvailable = isOpfsSupported() && !isTauriRuntime();
  const tauriAvailable = isTauriRuntime();
  const localDiskAvailable = isSystemFolderSupported();
  const outputPath =
    workspace?.type === "tauri" && workspace.outputPath?.trim()
      ? workspace.outputPath.trim()
      : null;

  const refreshOpfs = useCallback(async () => {
    if (!opfsAvailable) {
      setOpfsFiles([]);
      return;
    }
    try {
      setOpfsError(null);
      setOpfsFiles(await listOpfsGametypes());
    } catch (error) {
      setOpfsError(String(error));
      setOpfsFiles([]);
    }
  }, [opfsAvailable]);

  const refreshLocal = useCallback(async () => {
    const rootPath = localRootPathRef.current;
    if (!rootPath) {
      setLocalTree([]);
      onWorkspaceObjectListsChange?.(null);
      onMissingObjectListNamesChange?.([]);
      lastObjectListsJsonRef.current = "";
      return;
    }
    const root: LocalDiskRoot = { path: rootPath };
    try {
      setLocalError(null);
      const { nodes: tree, missingListNames } = await listSystemMegaloTree(
        root,
        objectListNames
      );
      if (localRootPathRef.current !== rootPath) {
        return;
      }
      setLocalTree(tree);
      onMissingObjectListNamesChange?.(missingListNames);
      if (objectListsFolderIsEmpty(tree)) {
        setEnsureExpandedKeys((keys) =>
          keys.includes("object_lists") ? keys : [...keys, "object_lists"]
        );
      }
      const lists = await loadWorkspaceObjectLists(rootPath, objectListNames);
      if (localRootPathRef.current !== rootPath) {
        return;
      }
      const listsJson = JSON.stringify(lists);
      if (listsJson !== lastObjectListsJsonRef.current) {
        lastObjectListsJsonRef.current = listsJson;
        onWorkspaceObjectListsChange?.(lists);
      }
    } catch (error) {
      if (localRootPathRef.current !== rootPath) {
        return;
      }
      setLocalError(String(error));
      setLocalTree([]);
      onMissingObjectListNamesChange?.([]);
    }
  }, [
    objectListNames,
    onMissingObjectListNamesChange,
    onWorkspaceObjectListsChange,
  ]);

  const refreshBuilds = useCallback(async () => {
    if (!outputPath) {
      setBuildOutputs([]);
      setBuildsError(null);
      return;
    }
    try {
      setBuildsError(null);
      setBuildOutputs(await listSystemBuildOutputs(outputPath));
    } catch (error) {
      setBuildsError(String(error));
      setBuildOutputs([]);
    }
  }, [outputPath]);

  // Drop stale tree UI immediately when the workspace root changes.
  useEffect(() => {
    setLocalTree([]);
    setLocalError(null);
    setEnsureExpandedKeys([]);
    setRenamingPathKey(null);
    setContextMenu(null);
    setPendingDelete(null);
    setPastePayload(null);
    lastObjectListsJsonRef.current = "";
    if (!localRootPath) {
      onWorkspaceObjectListsChange?.(null);
      onMissingObjectListNamesChange?.([]);
    }
  }, [
    localRootPath,
    onMissingObjectListNamesChange,
    onWorkspaceObjectListsChange,
  ]);

  useEffect(() => {
    void refreshOpfs();
  }, [refreshOpfs, opfsRevision]);

  useEffect(() => {
    void refreshLocal();
  }, [refreshLocal, localDiskRevision, localRootPath]);

  useEffect(() => {
    void refreshBuilds();
  }, [refreshBuilds, localDiskRevision]);

  useEffect(() => {
    if (!(tauriAvailable && localRoot)) {
      return;
    }

    let disposed = false;
    let unwatch: (() => void) | null = null;

    void (async () => {
      try {
        const stop = await watchWorkspaceInput(localRoot.path, () => {
          void refreshLocal();
        });
        unwatch = stop;
        if (disposed) {
          unwatch?.();
          unwatch = null;
        }
      } catch (error) {
        console.error("Failed to watch workspace input folder:", error);
      }
    })();

    return () => {
      disposed = true;
      unwatch?.();
      unwatch = null;
    };
  }, [tauriAvailable, localRoot, refreshLocal]);

  useEffect(() => {
    if (!(tauriAvailable && outputPath)) {
      return;
    }

    let disposed = false;
    let unwatch: (() => void) | null = null;

    void (async () => {
      try {
        const stop = await watchWorkspaceInput(outputPath, () => {
          void refreshBuilds();
        });
        unwatch = stop;
        if (disposed) {
          unwatch?.();
          unwatch = null;
        }
      } catch (error) {
        console.error("Failed to watch workspace output folder:", error);
      }
    })();

    return () => {
      disposed = true;
      unwatch?.();
      unwatch = null;
    };
  }, [tauriAvailable, outputPath, refreshBuilds]);

  const rejectBrowserMegaloSource = useCallback(
    (name: string): boolean => {
      if (tauriAvailable || !name.toLowerCase().endsWith(".txt")) {
        return false;
      }
      setOpfsError(t("files_browser_txt_desktop_only"));
      return true;
    },
    [t, tauriAvailable]
  );

  const openDroppedFile = useCallback(
    async (file: File) => {
      if (rejectBrowserMegaloSource(file.name)) {
        return;
      }
      try {
        setOpfsError(null);
        const lower = file.name.toLowerCase();
        if (lower.endsWith(".bin") || lower.endsWith(".blf")) {
          setOpfsError(t("files_compiled_open_unsupported"));
          return;
        }
        if (lower.endsWith(".txt")) {
          const text = await readTextFileBlob(file);
          onOpenSource(text, file.name);
          return;
        }
        setOpfsError(t("files_unsupported_file_type", { name: file.name }));
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [onOpenSource, rejectBrowserMegaloSource, t]
  );

  const handleDroppedFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }
      void openDroppedFile(file);
    },
    [openDroppedFile]
  );

  const openOpfsFile = useCallback(
    async (name: string) => {
      try {
        setOpfsError(null);
        const source = (await readOpfsGametypeSource(name)) ?? "";
        onOpenSource(source, name);
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [onOpenSource]
  );

  const createOpfsFile = useCallback(async () => {
    try {
      setOpfsError(null);
      const name = await createOpfsGametype();
      await refreshOpfs();
      setRenamingOpfsName(name);
      const source = (await readOpfsGametypeSource(name)) ?? "";
      onOpenSource(source, name);
    } catch (error) {
      setOpfsError(String(error));
    }
  }, [onOpenSource, refreshOpfs]);

  const commitOpfsRename = useCallback(
    async (fromName: string, newName: string) => {
      try {
        setOpfsError(null);
        const toName = await renameOpfsGametype(fromName, newName);
        setRenamingOpfsName(null);
        await refreshOpfs();
        if (
          fromName.localeCompare(toName, undefined, {
            sensitivity: "accent",
          }) !== 0
        ) {
          onFileRenamed(fromName, toName, opfsGametypeLogicalPath(toName));
        }
      } catch (error) {
        setOpfsError(String(error));
        setRenamingOpfsName(null);
      }
    },
    [onFileRenamed, refreshOpfs]
  );

  const deleteOpfsFile = useCallback(
    async (name: string, options?: { skipConfirm?: boolean }) => {
      if (
        !(
          options?.skipConfirm ||
          window.confirm(t("files_delete_opfs_confirm", { name }))
        )
      ) {
        return;
      }
      try {
        setOpfsError(null);
        await deleteOpfsGametype(name);
        setRenamingOpfsName(null);
        await refreshOpfs();
        onFileDeleted(name);
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [onFileDeleted, refreshOpfs, t]
  );

  const copyOpfsPath = useCallback(async (name: string) => {
    try {
      setOpfsError(null);
      await writeClipboardText(opfsGametypeLogicalPath(name));
    } catch (error) {
      setOpfsError(String(error));
    }
  }, []);

  const pasteOpfsFile = useCallback(
    async (payload: FileClipboardPayload) => {
      if (payload.source !== "opfs") {
        return;
      }
      try {
        setOpfsError(null);
        const name = await duplicateOpfsGametype(payload.name);
        await refreshOpfs();
        setRenamingOpfsName(name);
        await openOpfsFile(name);
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [openOpfsFile, refreshOpfs]
  );
  const openLocalFile = useCallback(
    async (path: string[]) => {
      if (!localRoot) {
        return;
      }
      try {
        setLocalError(null);
        const absoluteFilePath = await resolveSystemMegaloFilePath(
          localRoot,
          path
        );
        const node = findLocalDiskNode(localTree, path);
        let text: string;
        if (node?.virtual) {
          text = defaultObjectListText(
            node.name,
            workspace?.megaloVersion ?? "107-mcc"
          );
        } else {
          text = await readSystemMegaloFile(localRoot, path);
        }
        onOpenSource(text, formatLocalDiskPath(path), { absoluteFilePath });
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, localTree, onOpenSource, workspace?.megaloVersion]
  );

  useEffect(() => {
    const next = [
      ...flattenSourceFileNodes(localTree).map((node) => {
        const dir = node.path.slice(0, -1);
        return {
          id: `local:${pathKey(node.path)}`,
          label: node.name,
          description:
            dir.length > 0
              ? formatLocalDiskPath(dir)
              : (workspace?.name ?? "Workspace"),
          open: () => void openLocalFile(node.path),
        };
      }),
      ...opfsFiles.map((entry) => ({
        id: `opfs:${entry.name}`,
        label: entry.name,
        description: "Browser storage",
        open: () => void openOpfsFile(entry.name),
      })),
    ];
    setSourceFileQuickOpenEntries(next);
    return () => setSourceFileQuickOpenEntries([]);
  }, [localTree, opfsFiles, openLocalFile, openOpfsFile, workspace?.name]);

  const createLocalFile = useCallback(
    async (parentSegments: string[] = []) => {
      if (!localRoot) {
        return;
      }
      try {
        setLocalError(null);
        const createdPath = await createSystemMegaloTextFile(
          localRoot,
          parentSegments
        );
        const expandKeys = parentSegments.map((_, index) =>
          pathKey(parentSegments.slice(0, index + 1))
        );
        setEnsureExpandedKeys(expandKeys);
        await refreshLocal();
        setRenamingPathKey(pathKey(createdPath));
        await openLocalFile(createdPath);
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, openLocalFile, refreshLocal]
  );

  const createLocalFolder = useCallback(
    async (parentSegments: string[] = []) => {
      if (!localRoot) {
        return;
      }
      try {
        setLocalError(null);
        const createdPath = await createSystemMegaloDirectory(
          localRoot,
          parentSegments
        );
        const expandKeys = [
          ...parentSegments.map((_, index) =>
            pathKey(parentSegments.slice(0, index + 1))
          ),
          pathKey(createdPath),
        ];
        setEnsureExpandedKeys(expandKeys);
        await refreshLocal();
        setRenamingPathKey(pathKey(createdPath));
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, refreshLocal]
  );

  const commitRename = useCallback(
    async (fromPath: string[], newName: string) => {
      if (!localRoot) {
        setRenamingPathKey(null);
        return;
      }
      const oldDisplay = formatLocalDiskPath(fromPath);
      try {
        setLocalError(null);
        const toPath = await renameSystemMegaloFile(
          localRoot,
          fromPath,
          newName
        );
        setRenamingPathKey(null);
        await refreshLocal();
        const newDisplay = formatLocalDiskPath(toPath);
        if (oldDisplay !== newDisplay) {
          const absoluteFilePath = await resolveSystemMegaloFilePath(
            localRoot,
            toPath
          );
          onFileRenamed(oldDisplay, newDisplay, absoluteFilePath);
        }
      } catch (error) {
        setLocalError(String(error));
        setRenamingPathKey(null);
      }
    },
    [localRoot, onFileRenamed, refreshLocal]
  );

  const applyLocalMove = useCallback(
    async (
      fromPath: string[],
      toParentPath: string[],
      options?: { replace?: boolean }
    ): Promise<"moved" | "noop" | "needs_replace" | "error"> => {
      if (!localRoot) {
        return "error";
      }
      const oldDisplay = formatLocalDiskPath(fromPath);
      try {
        setLocalError(null);
        const result = await moveSystemMegaloEntry(
          localRoot,
          fromPath,
          toParentPath,
          options
        );
        if (result.status === "needs_replace") {
          return "needs_replace";
        }
        if (result.status === "noop") {
          return "noop";
        }
        const toPath = result.path;
        const expandKeys = toParentPath.map((_, index) =>
          pathKey(toParentPath.slice(0, index + 1))
        );
        setEnsureExpandedKeys(expandKeys);
        await refreshLocal();
        const newDisplay = formatLocalDiskPath(toPath);
        if (oldDisplay !== newDisplay) {
          const absoluteFilePath = await resolveSystemMegaloFilePath(
            localRoot,
            toPath
          );
          onFileRenamed(oldDisplay, newDisplay, absoluteFilePath);
        }
        return "moved";
      } catch (error) {
        setLocalError(String(error));
        return "error";
      }
    },
    [localRoot, onFileRenamed, refreshLocal]
  );

  const moveLocalEntries = useCallback(
    async (
      fromPaths: string[][],
      toParentPath: string[],
      options?: { replaceFirst?: boolean }
    ) => {
      const queue = pruneNestedPaths(fromPaths);
      let replaceNext = options?.replaceFirst === true;
      while (queue.length > 0) {
        const fromPath = queue.shift()!;
        const status = await applyLocalMove(fromPath, toParentPath, {
          replace: replaceNext,
        });
        replaceNext = false;
        if (status === "needs_replace") {
          const displayName = fromPath.at(-1) ?? formatLocalDiskPath(fromPath);
          const destPath = [...toParentPath, displayName];
          const destNode = findLocalDiskNode(localTree, destPath);
          setPendingReplace({
            fromPath,
            toParentPath,
            remaining: queue,
            displayName,
            targetKind: destNode?.type === "directory" ? "directory" : "file",
          });
          return;
        }
        if (status === "error") {
          return;
        }
      }
    },
    [applyLocalMove, localTree]
  );

  const deleteLocalFiles = useCallback(
    async (paths: string[][]) => {
      if (!localRoot) {
        return;
      }
      const pruned = pruneNestedPaths(paths);
      if (pruned.length === 0) {
        return;
      }
      try {
        setLocalError(null);
        for (const path of pruned) {
          const display = formatLocalDiskPath(path);
          await deleteSystemMegaloFile(localRoot, path);
          onFileDeleted(display);
        }
        setRenamingPathKey(null);
        await refreshLocal();
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, onFileDeleted, refreshLocal]
  );

  const pasteLocalFile = useCallback(
    async (parentSegments: string[], payload: FileClipboardPayload) => {
      if (!localRoot || payload.source !== "local") {
        return;
      }
      try {
        setLocalError(null);
        const createdPath = await duplicateSystemMegaloFile(
          localRoot,
          payload.path,
          parentSegments
        );
        const expandKeys = parentSegments.map((_, index) =>
          pathKey(parentSegments.slice(0, index + 1))
        );
        setEnsureExpandedKeys(expandKeys);
        await refreshLocal();
        setRenamingPathKey(pathKey(createdPath));
        await openLocalFile(createdPath);
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, openLocalFile, refreshLocal]
  );

  const refreshPasteFromClipboard = useCallback(() => {
    void readFileClipboard().then(setPastePayload);
  }, []);

  const onTreeContextMenu = useCallback(
    (
      event: MouseEvent,
      target: { type: "file" | "directory"; path: string[]; virtual?: boolean },
      selectedTargets: FilesContextTarget[]
    ) => {
      setPastePayload(null);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        source: "local",
        target,
        selectedTargets,
      });
      refreshPasteFromClipboard();
    },
    [refreshPasteFromClipboard]
  );

  const onOpfsContextMenu = useCallback(
    (event: MouseEvent, name: string) => {
      event.preventDefault();
      setPastePayload(null);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        source: "opfs",
        target: { type: "file", path: [name] },
      });
      refreshPasteFromClipboard();
    },
    [refreshPasteFromClipboard]
  );

  const onBuildsContextMenu = useCallback((event: MouseEvent, name: string) => {
    event.preventDefault();
    setPastePayload(null);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      source: "builds",
      target: { type: "file", path: [name] },
    });
  }, []);

  const resolveContextAbsolutePath = useCallback(
    async (
      path: string[],
      source: FilesContextSource
    ): Promise<string | null> => {
      if (source === "builds") {
        if (!outputPath) {
          return null;
        }
        return resolveSystemMegaloFilePath({ path: outputPath }, path);
      }
      if (source === "local") {
        if (!localRoot) {
          return null;
        }
        return resolveSystemMegaloFilePath(localRoot, path);
      }
      return null;
    },
    [localRoot, outputPath]
  );

  const isActive = (name: string) =>
    activeFileName !== null &&
    activeFileName.localeCompare(name, undefined, { sensitivity: "accent" }) ===
      0;

  return (
    <section
      aria-label={t("files_aria_label")}
      className={`files-panel${dragActive ? " files-panel--drag" : ""}`}
      onDragLeave={(event) => {
        if (
          isMegacrowTreeDragActive() ||
          Array.from(event.dataTransfer.types).includes(MEGACROW_TREE_PATH_MIME)
        ) {
          return;
        }
        setDragActive(false);
      }}
      onDragOver={(event) => {
        if (
          isMegacrowTreeDragActive() ||
          Array.from(event.dataTransfer.types).includes(MEGACROW_TREE_PATH_MIME)
        ) {
          return;
        }
        event.preventDefault();
        setDragActive(true);
      }}
      onDrop={(event) => {
        if (
          isMegacrowTreeDragActive() ||
          Array.from(event.dataTransfer.types).includes(MEGACROW_TREE_PATH_MIME)
        ) {
          return;
        }
        event.preventDefault();
        setDragActive(false);
        handleDroppedFiles(event.dataTransfer.files);
      }}
    >
      <header className="files-panel-header">
        {workspaceSwitcher &&
        onSelectWorkspace &&
        onAddWorkspace &&
        onEditWorkspace &&
        onDeleteWorkspace ? (
          <WorkspaceMenu
            onAddWorkspace={onAddWorkspace}
            onDeleteWorkspace={onDeleteWorkspace}
            onEditWorkspace={onEditWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            workspace={workspace}
            workspaces={workspaces}
          />
        ) : (
          <div className="files-panel-heading">
            <h2 className="files-panel-title">
              {workspace ? workspace.name : t("files_explorer_title")}
            </h2>
          </div>
        )}
      </header>

      <div className="files-panel-body">
        {opfsAvailable ? (
          <div className="files-section">
            <div className="files-section-label">
              <span>{t("files_browser_saves")}</span>
              <div className="files-section-label-end">
                {opfsFiles.length > 0 ? (
                  <span className="files-section-count">
                    {t("files_count", { count: opfsFiles.length })}
                  </span>
                ) : null}
                <button
                  aria-label={t("files_new_file")}
                  className="files-panel-icon-action"
                  onClick={() => void createOpfsFile()}
                  title={t("files_new_file")}
                  type="button"
                >
                  <NewFileGlyph />
                </button>
              </div>
            </div>
            <div className="files-section-scroll">
              {opfsError ? (
                <p className="files-hint files-hint--error">{opfsError}</p>
              ) : null}
              {opfsFiles.length === 0 && !opfsError ? (
                <div className="files-empty">
                  <p>{t("files_no_saved_files")}</p>
                  <span>{t("files_use_new_file_hint")}</span>
                </div>
              ) : opfsFiles.length > 0 ? (
                <ul className="files-tree">
                  {opfsFiles.map((entry) => {
                    const isRenaming = renamingOpfsName === entry.name;
                    return (
                      <li className="files-tree-node" key={entry.name}>
                        <div
                          className={`files-row${isActive(entry.name) ? " files-row--active" : ""}`}
                        >
                          {isRenaming ? (
                            <div
                              className={`files-row-btn files-row-btn--renaming${isActive(entry.name) ? " files-row-btn--active" : ""}`}
                            >
                              <FileGlyph />
                              <FilesRenameInput
                                initialName={entry.name}
                                onCancel={() => setRenamingOpfsName(null)}
                                onCommit={(value) =>
                                  void commitOpfsRename(entry.name, value)
                                }
                              />
                            </div>
                          ) : (
                            <button
                              className={`files-row-btn${isActive(entry.name) ? " files-row-btn--active" : ""}`}
                              onClick={() => void openOpfsFile(entry.name)}
                              onContextMenu={(event) =>
                                onOpfsContextMenu(event, entry.name)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "F2") {
                                  event.preventDefault();
                                  setRenamingOpfsName(entry.name);
                                }
                              }}
                              title={entry.name}
                              type="button"
                            >
                              <FileGlyph />
                              <span className="files-row-label">
                                {entry.name}
                              </span>
                            </button>
                          )}
                          {isRenaming ? null : (
                            <button
                              aria-label={t("files_delete_named", {
                                name: entry.name,
                              })}
                              className="files-row-delete"
                              onClick={() => void deleteOpfsFile(entry.name)}
                              title={t("files_delete_named", {
                                name: entry.name,
                              })}
                              type="button"
                            >
                              <svg aria-hidden="true" viewBox="0 0 16 16">
                                <path
                                  d="M4.5 4.5l7 7M11.5 4.5l-7 7"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeWidth="1.3"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {localDiskAvailable ? (
          <div className="files-section files-section--scripts">
            {localRoot ? (
              <div className="files-section-label">
                <span>{`${systemFolderLabel(localRoot)}/`}</span>
                <div className="files-section-label-end">
                  {localTree.length > 0 ? (
                    <span className="files-section-count">
                      {t("files_count", { count: countFiles(localTree) })}
                    </span>
                  ) : null}
                  <button
                    aria-label={t("files_new_file")}
                    className="files-panel-icon-action"
                    onClick={() => void createLocalFile([])}
                    title={t("files_new_file")}
                    type="button"
                  >
                    <NewFileGlyph />
                  </button>
                  <button
                    aria-label={t("files_new_folder")}
                    className="files-panel-icon-action"
                    onClick={() => void createLocalFolder([])}
                    title={t("files_new_folder")}
                    type="button"
                  >
                    <NewFolderGlyph />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="files-section-scroll">
              {localRoot ? (
                <>
                  {localError ? (
                    <p className="files-hint files-hint--error">{localError}</p>
                  ) : null}
                  {localTree.length === 0 ? (
                    <div className="files-empty">
                      <p>{t("files_no_megalo_scripts")}</p>
                      <span>{t("files_add_txt_or_new_file")}</span>
                    </div>
                  ) : (
                    <LocalDiskTree
                      activeFileName={activeFileName}
                      ensureExpandedKeys={ensureExpandedKeys}
                      key={workspace?.id ?? localRootPath ?? "local"}
                      nodes={localTree}
                      objectListNames={objectListNames}
                      onBeginRename={(path) => {
                        const node = findLocalDiskNode(localTree, path);
                        if (node?.virtual) {
                          return;
                        }
                        setRenamingPathKey(pathKey(path));
                      }}
                      onCancelRename={() => setRenamingPathKey(null)}
                      onCommitRename={(path, name) =>
                        void commitRename(path, name)
                      }
                      onContextMenu={onTreeContextMenu}
                      onMoveEntries={(fromPaths, toParentPath) =>
                        void moveLocalEntries(fromPaths, toParentPath)
                      }
                      onOpenFile={(path) => void openLocalFile(path)}
                      renamingPathKey={renamingPathKey}
                    />
                  )}
                </>
              ) : (
                <div className="files-empty">
                  <p>{t("files_no_workspace")}</p>
                  <span>
                    {onAddWorkspace
                      ? t("files_add_workspace_hint")
                      : t("files_select_workspace_hint")}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {outputPath ? (
          <div
            className={`files-builds${buildsOpen ? " files-builds--open" : ""}`}
          >
            <button
              aria-expanded={buildsOpen}
              className="files-builds-header"
              onClick={toggleBuildsOpen}
              type="button"
            >
              <svg
                aria-hidden="true"
                className={`files-builds-chevron${buildsOpen ? " files-builds-chevron--open" : ""}`}
                height="12"
                viewBox="0 0 16 16"
                width="12"
              >
                <path
                  d="M6 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="files-builds-title">
                {t("files_built_gametypes")}
              </span>
              {buildOutputs.length > 0 ? (
                <span className="files-section-count">
                  {buildOutputs.length}
                </span>
              ) : null}
            </button>
            {buildsOpen ? (
              <>
                <div
                  aria-label={t("files_resize_built_gametypes_pane")}
                  aria-orientation="horizontal"
                  aria-valuemax={BUILDS_PANE_MAX_HEIGHT}
                  aria-valuemin={BUILDS_PANE_MIN_HEIGHT}
                  aria-valuenow={buildsHeight}
                  className="files-builds-resizer"
                  onPointerDown={onBuildsResizeStart}
                  role="separator"
                />
                <div
                  className="files-builds-body"
                  style={{ height: buildsHeight }}
                >
                  {buildsError ? (
                    <p className="files-hint files-hint--error">
                      {buildsError}
                    </p>
                  ) : null}
                  {buildOutputs.length === 0 && !buildsError ? (
                    <div className="files-empty files-empty--compact">
                      <p>{t("files_no_built_gametypes_yet")}</p>
                      <span>{t("files_use_build_hint")}</span>
                    </div>
                  ) : (
                    <ul className="files-tree">
                      {buildOutputs.map((entry) => (
                        <li className="files-tree-node" key={entry.name}>
                          <button
                            className="files-row-btn files-row-btn--built"
                            onClick={() => onClearEditor?.()}
                            onContextMenu={(event) =>
                              onBuildsContextMenu(event, entry.name)
                            }
                            title={entry.name}
                            type="button"
                          >
                            <span
                              aria-hidden="true"
                              className="files-chevron-spacer"
                            />
                            <BuiltGametypeGlyph />
                            <span className="files-row-label">
                              {entry.name}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {opfsAvailable || localDiskAvailable ? null : (
          <div className="files-empty">
            <p>{t("files_no_file_sources")}</p>
            <span>{t("files_drop_gametype_hint")}</span>
          </div>
        )}
      </div>

      <FilesContextMenu
        canPaste={
          pastePayload !== null &&
          contextMenu !== null &&
          pastePayload.source === contextMenu.source
        }
        menu={contextMenu}
        onClose={() => {
          setContextMenu(null);
          setPastePayload(null);
        }}
        onCopy={(path, source) => {
          void (async () => {
            try {
              if (source === "opfs") {
                const name = path[0];
                if (!name) {
                  return;
                }
                const payload = { source: "opfs" as const, name };
                const files = await getOpfsGametypeClipboardFiles(name);
                await writeFileClipboard(payload, { files });
                setPastePayload(payload);
                return;
              }
              if (source === "builds") {
                return;
              }
              if (!localRoot) {
                return;
              }
              const payload = {
                source: "local" as const,
                path: [...path],
              };
              const absolute = await resolveSystemMegaloFilePath(
                localRoot,
                path
              );
              await writeFileClipboard(payload, {
                absolutePaths: [absolute],
              });
              setPastePayload(payload);
            } catch (error) {
              if (source === "opfs") {
                setOpfsError(String(error));
              } else if (source === "builds") {
                setBuildsError(String(error));
              } else {
                setLocalError(String(error));
              }
            }
          })();
        }}
        onCopyPath={(paths, source) => {
          if (source === "opfs") {
            const name = paths[0]?.[0];
            if (name) {
              void copyOpfsPath(name);
            }
            return;
          }
          void (async () => {
            try {
              const absolutes: string[] = [];
              for (const path of paths) {
                const absolute = await resolveContextAbsolutePath(path, source);
                if (absolute) {
                  absolutes.push(absolute);
                }
              }
              if (absolutes.length === 0) {
                return;
              }
              await writeClipboardText(absolutes.join("\n"));
            } catch (error) {
              if (source === "builds") {
                setBuildsError(String(error));
              } else {
                setLocalError(String(error));
              }
            }
          })();
        }}
        onDelete={(targets, source) => {
          const deletable = targets.filter((target) => !target.virtual);
          if (deletable.length === 0) {
            return;
          }
          setPendingDelete({
            paths: deletable.map((target) => target.path),
            source,
            targets: deletable,
          });
        }}
        onNewFile={(parentPath, source) => {
          if (source === "local") {
            void createLocalFile(parentPath);
          }
        }}
        onNewFolder={(parentPath, source) => {
          if (source === "local") {
            void createLocalFolder(parentPath);
          }
        }}
        onPaste={(target, source) => {
          void (async () => {
            const payload = (await readFileClipboard()) ?? pastePayload;
            if (!payload || payload.source !== source) {
              return;
            }
            if (source === "opfs") {
              await pasteOpfsFile(payload);
              return;
            }
            const parent =
              target.type === "directory"
                ? target.path
                : target.path.slice(0, -1);
            await pasteLocalFile(parent, payload);
          })();
        }}
        onRename={(path, source) => {
          if (source === "opfs") {
            const name = path[0];
            if (name) {
              setRenamingOpfsName(name);
            }
            return;
          }
          if (source === "builds") {
            return;
          }
          const node = findLocalDiskNode(localTree, path);
          if (node?.virtual) {
            return;
          }
          setRenamingPathKey(pathKey(path));
        }}
        onReveal={
          tauriAvailable
            ? (path, source) => {
                void (async () => {
                  try {
                    const absolute = await resolveContextAbsolutePath(
                      path,
                      source
                    );
                    if (!absolute) {
                      return;
                    }
                    await revealInFileManager(absolute);
                  } catch (error) {
                    if (source === "builds") {
                      setBuildsError(String(error));
                    } else {
                      setLocalError(String(error));
                    }
                  }
                })();
              }
            : undefined
        }
      />

      <ConfirmDeleteDialog
        count={pendingDelete?.paths.length ?? 1}
        name={
          pendingDelete
            ? (pendingDelete.paths[0]?.at(-1) ??
              formatLocalDiskPath(pendingDelete.paths[0] ?? []))
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }
          const { paths, source } = pendingDelete;
          setPendingDelete(null);
          if (source === "opfs") {
            const name = paths[0]?.[0];
            if (name) {
              void deleteOpfsFile(name, { skipConfirm: true });
            }
            return;
          }
          if (source === "builds") {
            void (async () => {
              if (!outputPath) {
                return;
              }
              try {
                setBuildsError(null);
                for (const path of paths) {
                  await deleteSystemMegaloFile({ path: outputPath }, path);
                }
                await refreshBuilds();
              } catch (error) {
                setBuildsError(String(error));
                console.error("Failed to delete built gametype(s):", error);
              }
            })();
            return;
          }
          void deleteLocalFiles(paths);
        }}
        open={pendingDelete !== null}
        targetKind={
          pendingDelete && pendingDelete.targets.length > 1
            ? "mixed"
            : (pendingDelete?.targets[0]?.type ?? "file")
        }
      />

      <ConfirmReplaceDialog
        name={pendingReplace?.displayName ?? ""}
        onCancel={() => setPendingReplace(null)}
        onConfirm={() => {
          if (!pendingReplace) {
            return;
          }
          const { fromPath, toParentPath, remaining } = pendingReplace;
          setPendingReplace(null);
          void moveLocalEntries([fromPath, ...remaining], toParentPath, {
            replaceFirst: true,
          });
        }}
        open={pendingReplace !== null}
        targetKind={pendingReplace?.targetKind ?? "file"}
      />
    </section>
  );
}

function countFiles(nodes: LocalDiskNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      total += 1;
    } else if (node.children) {
      total += countFiles(node.children);
    }
  }
  return total;
}
