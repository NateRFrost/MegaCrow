import { type MouseEvent, useCallback, useEffect, useState } from "react";
import { writeClipboardText } from "../lib/clipboard";
import { readTextFileBlob } from "../lib/decodeTextFile";
import {
  type FileClipboardPayload,
  readFileClipboard,
  writeFileClipboard,
} from "../lib/fileClipboard";
import { formatLocalDiskPath, pathKey } from "../lib/localFolder";
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
  readOpfsGametype,
  readOpfsGametypeSource,
  renameOpfsGametype,
} from "../lib/opfsStorage";
import {
  createSystemMegaloTextFile,
  deleteSystemMegaloFile,
  duplicateSystemMegaloFile,
  isSystemFolderSupported,
  type LocalDiskRoot,
  listSystemMegaloTree,
  readSystemMegaloFile,
  renameSystemMegaloFile,
  resolveSystemMegaloFilePath,
  systemFolderLabel,
  systemFolderTitle,
} from "../lib/systemFiles";
import { isTauriRuntime } from "../lib/tauriRuntime";
import type { Workspace } from "../lib/workspace";
import {
  FilesContextMenu,
  type FilesContextMenuState,
} from "./FilesContextMenu";
import { FilesRenameInput } from "./FilesRenameInput";
import { LocalDiskTree } from "./LocalDiskTree";
import { WorkspaceMenu } from "./WorkspaceMenu";

interface Props {
  activeFileName: string | null;
  localDiskRevision: number;
  onAddWorkspace?: () => void;
  onDeleteWorkspace?: (id: string) => void;
  onEditWorkspace?: (workspace: StoredWorkspace) => void;
  onFileDeleted: (name: string) => void;
  onFileRenamed: (
    oldName: string,
    newName: string,
    absoluteFilePath: string
  ) => void;
  onOpenFile: (bytes: Uint8Array, name: string) => void;
  onOpenSource: (
    source: string,
    name: string,
    includeRoot?: MegaloIncludeRoot
  ) => void;
  onSelectWorkspace?: (id: string) => void;
  opfsRevision: number;
  workspace: Workspace | null;
  workspaceSwitcher?: boolean;
  workspaces?: StoredWorkspace[];
}

function FileGlyph() {
  return (
    <svg aria-hidden="true" className="files-glyph" viewBox="0 0 16 16">
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

export function FilesPanel({
  workspace,
  workspaces = [],
  onSelectWorkspace,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  workspaceSwitcher = false,
  onOpenFile,
  onOpenSource,
  onFileDeleted,
  onFileRenamed,
  activeFileName,
  opfsRevision,
  localDiskRevision,
}: Props) {
  const [opfsFiles, setOpfsFiles] = useState<OpfsGametypeEntry[]>([]);
  const [opfsError, setOpfsError] = useState<string | null>(null);
  const [localRoot, setLocalRoot] = useState<LocalDiskRoot | null>(() =>
    workspace?.type === "tauri" ? { path: workspace.inputPath } : null
  );
  const [localTree, setLocalTree] = useState<
    Awaited<ReturnType<typeof listSystemMegaloTree>>
  >([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<FilesContextMenuState | null>(
    null
  );
  const [renamingPathKey, setRenamingPathKey] = useState<string | null>(null);
  const [renamingOpfsName, setRenamingOpfsName] = useState<string | null>(null);
  const [ensureExpandedKeys, setEnsureExpandedKeys] = useState<string[]>([]);
  const [pastePayload, setPastePayload] = useState<FileClipboardPayload | null>(
    null
  );

  const opfsAvailable = isOpfsSupported() && !isTauriRuntime();
  const tauriAvailable = isTauriRuntime();
  const localDiskAvailable = isSystemFolderSupported();

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
    if (!localRoot) {
      setLocalTree([]);
      return;
    }
    try {
      setLocalError(null);
      setLocalTree(await listSystemMegaloTree(localRoot));
    } catch (error) {
      setLocalError(String(error));
      setLocalTree([]);
    }
  }, [localRoot]);

  useEffect(() => {
    if (workspace?.type === "tauri") {
      setLocalRoot({ path: workspace.inputPath });
      return;
    }
    setLocalRoot(null);
    setLocalTree([]);
    setLocalError(null);
  }, [workspace]);

  useEffect(() => {
    void refreshOpfs();
  }, [refreshOpfs, opfsRevision]);

  useEffect(() => {
    void refreshLocal();
  }, [refreshLocal, localDiskRevision]);

  const rejectBrowserMegaloSource = useCallback(
    (name: string): boolean => {
      if (tauriAvailable || !name.toLowerCase().endsWith(".txt")) {
        return false;
      }
      setOpfsError(
        "Megalo .txt source files must be opened in the desktop app. In the browser, open saved gametypes from the list below."
      );
      return true;
    },
    [tauriAvailable]
  );

  const openDroppedFile = useCallback(
    async (file: File) => {
      if (rejectBrowserMegaloSource(file.name)) {
        return;
      }
      try {
        setOpfsError(null);
        if (file.name.toLowerCase().endsWith(".txt")) {
          const text = await readTextFileBlob(file);
          onOpenSource(text, file.name);
          return;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        onOpenFile(bytes, file.name);
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [onOpenFile, onOpenSource, rejectBrowserMegaloSource]
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
        const bytes = await readOpfsGametype(name);
        if (bytes.length === 0) {
          const source = (await readOpfsGametypeSource(name)) ?? "";
          onOpenSource(source, name);
          return;
        }
        onOpenFile(bytes, name);
      } catch (error) {
        setOpfsError(String(error));
      }
    },
    [onOpenFile, onOpenSource]
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
          window.confirm(
            `Delete "${name}" from browser storage? This cannot be undone.`
          )
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
    [onFileDeleted, refreshOpfs]
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
        const text = await readSystemMegaloFile(localRoot, path);
        const absoluteFilePath = await resolveSystemMegaloFilePath(
          localRoot,
          path
        );
        onOpenSource(text, formatLocalDiskPath(path), { absoluteFilePath });
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, onOpenSource]
  );

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

  const deleteLocalFile = useCallback(
    async (path: string[], options?: { skipConfirm?: boolean }) => {
      if (!localRoot) {
        return;
      }
      const display = formatLocalDiskPath(path);
      if (
        !(
          options?.skipConfirm ||
          window.confirm(`Delete "${display}"? This cannot be undone.`)
        )
      ) {
        return;
      }
      try {
        setLocalError(null);
        await deleteSystemMegaloFile(localRoot, path);
        setRenamingPathKey(null);
        await refreshLocal();
        onFileDeleted(display);
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot, onFileDeleted, refreshLocal]
  );

  const copyLocalPath = useCallback(
    async (path: string[]) => {
      if (!localRoot) {
        return;
      }
      try {
        setLocalError(null);
        const absolute = await resolveSystemMegaloFilePath(localRoot, path);
        await writeClipboardText(absolute);
      } catch (error) {
        setLocalError(String(error));
      }
    },
    [localRoot]
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
      target: { type: "file" | "directory"; path: string[] }
    ) => {
      setPastePayload(null);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        source: "local",
        target,
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

  const isActive = (name: string) =>
    activeFileName !== null &&
    activeFileName.localeCompare(name, undefined, { sensitivity: "accent" }) ===
      0;

  return (
    <section
      aria-label="Files"
      className={`files-panel${dragActive ? " files-panel--drag" : ""}`}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDrop={(event) => {
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
              {workspace ? workspace.name : "Explorer"}
            </h2>
          </div>
        )}
      </header>

      <div className="files-panel-body">
        {opfsAvailable ? (
          <div className="files-section">
            <div className="files-section-label">
              <span>Browser saves</span>
              <div className="files-section-label-end">
                {opfsFiles.length > 0 ? (
                  <span className="files-section-count">
                    {opfsFiles.length} files
                  </span>
                ) : null}
                <button
                  aria-label="New File"
                  className="files-panel-icon-action"
                  onClick={() => void createOpfsFile()}
                  title="New File"
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
                  <p>No saved gametypes</p>
                  <span>Drop a .bin or .blf here, or use New File</span>
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
                              aria-label={`Delete ${entry.name}`}
                              className="files-row-delete"
                              onClick={() => void deleteOpfsFile(entry.name)}
                              title={`Delete ${entry.name}`}
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
          <div className="files-section">
            {localRoot ? (
              <div className="files-section-label">
                <span>{`${systemFolderLabel(localRoot)}/`}</span>
                <div className="files-section-label-end">
                  {localTree.length > 0 ? (
                    <span className="files-section-count">
                      {countFiles(localTree)} files
                    </span>
                  ) : null}
                  <button
                    aria-label="New File"
                    className="files-panel-icon-action"
                    onClick={() => void createLocalFile([])}
                    title="New File"
                    type="button"
                  >
                    <NewFileGlyph />
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
                      <p>No Megalo scripts</p>
                      <span>Add a .txt file or use New File</span>
                    </div>
                  ) : (
                    <LocalDiskTree
                      activeFileName={activeFileName}
                      ensureExpandedKeys={ensureExpandedKeys}
                      key={systemFolderTitle(localRoot)}
                      nodes={localTree}
                      onBeginRename={(path) =>
                        setRenamingPathKey(pathKey(path))
                      }
                      onCancelRename={() => setRenamingPathKey(null)}
                      onCommitRename={(path, name) =>
                        void commitRename(path, name)
                      }
                      onContextMenu={onTreeContextMenu}
                      onOpenFile={(path) => void openLocalFile(path)}
                      renamingPathKey={renamingPathKey}
                    />
                  )}
                </>
              ) : (
                <div className="files-empty">
                  <p>No workspace</p>
                  <span>
                    {onAddWorkspace
                      ? "Add a workspace to browse Megalo scripts"
                      : "Select a workspace to browse Megalo scripts"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {opfsAvailable || localDiskAvailable ? null : (
          <div className="files-empty">
            <p>No file sources available</p>
            <span>Drop a gametype onto this panel to open it</span>
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
              } else {
                setLocalError(String(error));
              }
            }
          })();
        }}
        onCopyPath={(path, source) => {
          if (source === "opfs") {
            const name = path[0];
            if (name) {
              void copyOpfsPath(name);
            }
            return;
          }
          void copyLocalPath(path);
        }}
        onDelete={(path, source) => {
          if (source === "opfs") {
            const name = path[0];
            if (name) {
              void deleteOpfsFile(name, { skipConfirm: true });
            }
            return;
          }
          void deleteLocalFile(path, { skipConfirm: true });
        }}
        onNewFile={(parentPath, source) => {
          if (source === "local") {
            void createLocalFile(parentPath);
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
          setRenamingPathKey(pathKey(path));
        }}
      />
    </section>
  );
}

function countFiles(
  nodes: Awaited<ReturnType<typeof listSystemMegaloTree>>
): number {
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
