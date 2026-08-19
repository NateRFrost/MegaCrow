import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  formatLocalDiskPath,
  type LocalDiskNode,
  pathKey,
} from "../lib/localFolder";
import {
  isObjectListsDirectoryName,
  isObjectListsPath,
  isRecognizedObjectListName,
} from "../lib/objectListsPath";
import { FilesRenameInput } from "./FilesRenameInput";

/** @deprecated Kept so FilesPanel can ignore stale HTML5 tree MIME if present. */
export const MEGACROW_TREE_PATH_MIME = "application/x-megacrow-tree-path";

const DRAG_THRESHOLD_PX = 5;

let activeTreeDragPaths: string[][] | null = null;

export function isMegacrowTreeDragActive(): boolean {
  return activeTreeDragPaths !== null;
}

interface Props {
  activeFileName: string | null;
  /** Path keys that should stay expanded (e.g. parent of a newly created file). */
  ensureExpandedKeys?: readonly string[];
  nodes: LocalDiskNode[];
  /** Filenames recognized for the active Megalo version (e.g. `objects.txt`). */
  objectListNames?: readonly string[];
  onBeginRename: (path: string[]) => void;
  onCancelRename: () => void;
  onCommitRename: (path: string[], newName: string) => void;
  onContextMenu: (
    event: ReactMouseEvent,
    target: { type: "file" | "directory"; path: string[]; virtual?: boolean },
    selectedTargets: Array<{
      type: "file" | "directory";
      path: string[];
      virtual?: boolean;
    }>
  ) => void;
  /** Move entries into `toParentPath` (empty = workspace root). */
  onMoveEntries: (fromPaths: string[][], toParentPath: string[]) => void;
  onOpenFile: (path: string[]) => void;
  /** Shown on the RHS of the `object_lists` folder when Editing Kit + tool.exe. */
  onRegenerateObjectLists?: () => void;
  regenerateObjectListsLabel?: string;
  renamingPathKey: string | null;
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

function FolderGlyph({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" className="files-glyph" viewBox="0 0 16 16">
      {open ? (
        <path
          d="M1.5 4.5h4l1.2 1.2H14.5v7.3H1.5z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      ) : (
        <path
          d="M1.5 3.5h4l1.2 1.2H14.5v8.3H1.5z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

function ObjectListsFolderGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="files-glyph files-glyph--object-lists"
      viewBox="0 0 16 16"
    >
      <path
        d="M1.5 3.5h4l1.2 1.2H14.5v8.3H1.5z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M4 8h8M4 10.25h8M4 12.5h5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function ObjectListFileGlyph({ virtual = false }: { virtual?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`files-glyph files-glyph--object-list-file${virtual ? " files-glyph--virtual" : " files-glyph--filled"}`}
      viewBox="0 0 16 16"
    >
      <path
        className="files-glyph-body"
        d="M3.5 1.5h6l3 3V14.5h-9z"
        fill={virtual ? "none" : "currentColor"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        className="files-glyph-fold"
        d="M9.5 1.5V4.5H12.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        className="files-glyph-detail"
        d="M5.25 8h5.5M5.25 10.25h5.5M5.25 12.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`files-chevron${open ? " files-chevron--open" : ""}`}
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
  );
}

function isSamePath(a: string[], b: string[]): boolean {
  return (
    a.length === b.length && a.every((segment, index) => segment === b[index])
  );
}

function isPathPrefix(prefix: string[], path: string[]): boolean {
  if (prefix.length === 0) {
    return true;
  }
  if (prefix.length > path.length) {
    return false;
  }
  return prefix.every((segment, index) => segment === path[index]);
}

/** Drop nested children when an ancestor is also selected. */
export function pruneNestedPaths(paths: string[][]): string[][] {
  const sorted = [...paths].sort((a, b) => a.length - b.length);
  const kept: string[][] = [];
  for (const path of sorted) {
    if (kept.some((prefix) => isPathPrefix(prefix, path))) {
      continue;
    }
    kept.push(path);
  }
  return kept;
}

function parsePathKey(key: string): string[] {
  if (key === "") {
    return [];
  }
  return key.split("/");
}

/** Destination parent for a drop path key (files → their parent). */
function dropParentForPathKey(
  targetKey: string,
  targetType: "file" | "directory" | "root",
  fromPath: string[]
): string[] | null {
  if (targetType === "root") {
    if (isPathPrefix(fromPath, [])) {
      return null;
    }
    const fromParent = fromPath.slice(0, -1);
    if (isSamePath(fromParent, [])) {
      return null;
    }
    return [];
  }
  const targetPath = parsePathKey(targetKey);
  if (targetType === "directory") {
    if (isSamePath(fromPath, targetPath)) {
      return null;
    }
    if (isPathPrefix(fromPath, targetPath)) {
      return null;
    }
    return targetPath;
  }
  const parent = targetPath.slice(0, -1);
  if (isPathPrefix(fromPath, parent)) {
    return null;
  }
  return parent;
}

function dropParentForPaths(
  targetKey: string,
  targetType: "file" | "directory" | "root",
  fromPaths: string[][]
): string[] | null {
  if (fromPaths.length === 0) {
    return null;
  }
  let result: string[] | null = null;
  for (const fromPath of fromPaths) {
    const parent = dropParentForPathKey(targetKey, targetType, fromPath);
    if (parent === null) {
      return null;
    }
    result = parent;
  }
  return result;
}

function findFilePathByDisplayName(
  nodes: readonly LocalDiskNode[],
  displayName: string
): string[] | null {
  for (const node of nodes) {
    if (node.type === "file") {
      const displayPath = formatLocalDiskPath(node.path);
      if (
        displayName.localeCompare(displayPath, undefined, {
          sensitivity: "accent",
        }) === 0
      ) {
        return node.path;
      }
    }
    if (node.children && node.children.length > 0) {
      const nested = findFilePathByDisplayName(node.children, displayName);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function ancestorPathKeys(path: string[]): string[] {
  const keys: string[] = [];
  for (let i = 1; i < path.length; i++) {
    keys.push(pathKey(path.slice(0, i)));
  }
  return keys;
}

function flattenVisibleNodes(
  nodes: LocalDiskNode[],
  expandedPaths: Set<string>
): LocalDiskNode[] {
  const out: LocalDiskNode[] = [];
  const walk = (list: LocalDiskNode[]) => {
    for (const node of list) {
      out.push(node);
      if (
        node.type === "directory" &&
        expandedPaths.has(pathKey(node.path)) &&
        node.children &&
        node.children.length > 0
      ) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return out;
}

function findDropTarget(
  clientX: number,
  clientY: number
): {
  key: string;
  type: "file" | "directory" | "root";
} | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!(el instanceof Element)) {
    return null;
  }
  const row = el.closest("[data-tree-drop]");
  if (row instanceof HTMLElement) {
    const key = row.dataset.treePath;
    const type = row.dataset.treeDrop;
    if (key === undefined || (type !== "file" && type !== "directory")) {
      return null;
    }
    return { key, type };
  }
  const root = el.closest("[data-tree-root]");
  if (root) {
    return { key: "", type: "root" };
  }
  return null;
}

function TreeNode({
  node,
  depth,
  activeFileName,
  dragOverKey,
  draggingKeys,
  expandedPaths,
  objectListNames,
  onRegenerateObjectLists,
  regenerateObjectListsLabel,
  renamingPathKey,
  selectedKeys,
  onPointerDownRow,
  onRowActivate,
  onToggleDirectory,
  onOpenFile,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
}: {
  node: LocalDiskNode;
  depth: number;
  activeFileName: string | null;
  dragOverKey: string | null;
  draggingKeys: Set<string>;
  expandedPaths: Set<string>;
  objectListNames: readonly string[];
  onRegenerateObjectLists?: () => void;
  regenerateObjectListsLabel?: string;
  renamingPathKey: string | null;
  selectedKeys: Set<string>;
  onPointerDownRow: (
    event: ReactPointerEvent<HTMLDivElement>,
    node: LocalDiskNode
  ) => void;
  /** Returns true when the row should also open/toggle. */
  onRowActivate: (
    event: ReactMouseEvent<HTMLDivElement>,
    node: LocalDiskNode
  ) => boolean;
  onToggleDirectory: (path: string[]) => void;
  onOpenFile: (path: string[]) => void;
  onBeginRename: (path: string[]) => void;
  onCommitRename: (path: string[], newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (
    event: ReactMouseEvent,
    target: { type: "file" | "directory"; path: string[]; virtual?: boolean }
  ) => void;
}) {
  const displayPath = formatLocalDiskPath(node.path);
  const nodeKey = pathKey(node.path);
  const isExpanded = expandedPaths.has(nodeKey);
  const isRenaming = renamingPathKey === nodeKey;
  const isDragging = draggingKeys.has(nodeKey);
  const isSelected = selectedKeys.has(nodeKey);
  const isDropTarget = dragOverKey === nodeKey && !isDragging;
  const indent = { "--files-depth": String(depth) } as CSSProperties;

  if (node.type === "file") {
    const isActive =
      activeFileName !== null &&
      activeFileName.localeCompare(displayPath, undefined, {
        sensitivity: "accent",
      }) === 0;
    const recognizedObjectList =
      isObjectListsPath(node.path) &&
      isRecognizedObjectListName(node.name, objectListNames);
    const isVirtual = node.virtual === true;

    return (
      <li className="files-tree-node">
        {isRenaming ? (
          <div
            className={`files-row-btn files-row-btn--renaming${isActive ? " files-row-btn--active" : ""}${isSelected ? " files-row-btn--selected" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}${isVirtual ? " files-row-btn--virtual" : ""}`}
            style={indent}
          >
            <span aria-hidden="true" className="files-chevron-spacer" />
            {recognizedObjectList ? (
              <ObjectListFileGlyph virtual={isVirtual} />
            ) : (
              <FileGlyph />
            )}
            <FilesRenameInput
              initialName={node.name}
              onCancel={onCancelRename}
              onCommit={(value) => onCommitRename(node.path, value)}
            />
          </div>
        ) : (
          <div
            aria-selected={isSelected}
            className={`files-row-btn${isActive ? " files-row-btn--active" : ""}${isSelected ? " files-row-btn--selected" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}${isVirtual ? " files-row-btn--virtual" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
            data-tree-drop="file"
            data-tree-path={nodeKey}
            onClick={(event) => {
              if (onRowActivate(event, node)) {
                onOpenFile(node.path);
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              onContextMenu(event, {
                type: "file",
                path: node.path,
                virtual: isVirtual,
              });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenFile(node.path);
              } else if (event.key === "F2" && !isVirtual) {
                event.preventDefault();
                onBeginRename(node.path);
              }
            }}
            onPointerDown={
              isVirtual ? undefined : (event) => onPointerDownRow(event, node)
            }
            role="treeitem"
            style={indent}
            tabIndex={0}
            title={
              isVirtual
                ? `${displayPath} (bundled default — save to create file)`
                : displayPath
            }
          >
            <span aria-hidden="true" className="files-chevron-spacer" />
            {recognizedObjectList ? (
              <ObjectListFileGlyph virtual={isVirtual} />
            ) : (
              <FileGlyph />
            )}
            <span className="files-row-label">{node.name}</span>
          </div>
        )}
      </li>
    );
  }

  const isObjectLists = isObjectListsDirectoryName(node.name);

  return (
    <li className="files-tree-node files-tree-node--branch">
      {isRenaming ? (
        <div
          className={`files-row-btn files-row-btn--folder files-row-btn--renaming${isSelected ? " files-row-btn--selected" : ""}${isObjectLists ? " files-row-btn--object-lists" : ""}`}
          style={indent}
        >
          <span aria-hidden="true" className="files-chevron-spacer" />
          {isObjectLists ? (
            <ObjectListsFolderGlyph />
          ) : (
            <FolderGlyph open={isExpanded} />
          )}
          <FilesRenameInput
            initialName={node.name}
            onCancel={onCancelRename}
            onCommit={(value) => onCommitRename(node.path, value)}
          />
        </div>
      ) : (
        <div
          aria-expanded={isExpanded}
          aria-selected={isSelected}
          className={`files-row-btn files-row-btn--folder${isObjectLists ? " files-row-btn--object-lists" : ""}${isSelected ? " files-row-btn--selected" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
          data-tree-drop="directory"
          data-tree-path={nodeKey}
          onClick={(event) => {
            if (onRowActivate(event, node)) {
              onToggleDirectory(node.path);
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu(event, { type: "directory", path: node.path });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleDirectory(node.path);
            } else if (event.key === "F2") {
              event.preventDefault();
              onBeginRename(node.path);
            }
          }}
          onPointerDown={(event) => onPointerDownRow(event, node)}
          role="treeitem"
          style={indent}
          tabIndex={0}
          title={displayPath}
        >
          <ChevronGlyph open={isExpanded} />
          {isObjectLists ? (
            <ObjectListsFolderGlyph />
          ) : (
            <FolderGlyph open={isExpanded} />
          )}
          <span className="files-row-label">{node.name}</span>
          {isObjectLists && onRegenerateObjectLists ? (
            <button
              aria-label={regenerateObjectListsLabel}
              className="files-row-regenerate"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRegenerateObjectLists();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              title={regenerateObjectListsLabel}
              type="button"
            >
              {regenerateObjectListsLabel}
            </button>
          ) : null}
        </div>
      )}
      {isExpanded && node.children && node.children.length > 0 ? (
        <ul
          className={`files-tree${isDropTarget ? " files-tree--drop-target" : ""}`}
          data-tree-drop="directory"
          data-tree-path={nodeKey}
        >
          {node.children.map((child) => (
            <TreeNode
              activeFileName={activeFileName}
              depth={depth + 1}
              draggingKeys={draggingKeys}
              dragOverKey={dragOverKey}
              expandedPaths={expandedPaths}
              key={pathKey(child.path)}
              node={child}
              objectListNames={objectListNames}
              onBeginRename={onBeginRename}
              onCancelRename={onCancelRename}
              onCommitRename={onCommitRename}
              onContextMenu={onContextMenu}
              onOpenFile={onOpenFile}
              onPointerDownRow={onPointerDownRow}
              onRegenerateObjectLists={onRegenerateObjectLists}
              onRowActivate={onRowActivate}
              onToggleDirectory={onToggleDirectory}
              regenerateObjectListsLabel={regenerateObjectListsLabel}
              renamingPathKey={renamingPathKey}
              selectedKeys={selectedKeys}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LocalDiskTree({
  nodes,
  activeFileName,
  objectListNames = [],
  onOpenFile,
  onRegenerateObjectLists,
  regenerateObjectListsLabel,
  renamingPathKey,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  onMoveEntries,
  ensureExpandedKeys = [],
}: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [selectionAnchorKey, setSelectionAnchorKey] = useState<string | null>(
    null
  );
  const [draggingKeys, setDraggingKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const selectedKeysRef = useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;
  const lastSyncedActiveFileRef = useRef<string | null>(null);
  const pendingRef = useRef<{
    path: string[];
    paths: string[][];
    x: number;
    y: number;
  } | null>(null);
  const draggingPathsRef = useRef<string[][] | null>(null);
  const dragOverKeyRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const rootDropKey = "";

  useEffect(() => {
    if (!activeFileName) {
      lastSyncedActiveFileRef.current = null;
      return;
    }
    const path = findFilePathByDisplayName(nodes, activeFileName);
    if (!path) {
      if (lastSyncedActiveFileRef.current !== null) {
        lastSyncedActiveFileRef.current = null;
        setSelectedKeys(new Set());
        setSelectionAnchorKey(null);
      }
      return;
    }
    if (lastSyncedActiveFileRef.current === activeFileName) {
      return;
    }
    lastSyncedActiveFileRef.current = activeFileName;
    const key = pathKey(path);
    setSelectedKeys(new Set([key]));
    setSelectionAnchorKey(key);
    const ancestors = ancestorPathKeys(path);
    if (ancestors.length === 0) {
      return;
    }
    setExpandedPaths((current) => {
      let changed = false;
      const next = new Set(current);
      for (const ancestor of ancestors) {
        if (!next.has(ancestor)) {
          next.add(ancestor);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [activeFileName, nodes]);

  useEffect(() => {
    if (ensureExpandedKeys.length === 0) {
      return;
    }
    setExpandedPaths((current) => {
      let changed = false;
      const next = new Set(current);
      for (const key of ensureExpandedKeys) {
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [ensureExpandedKeys]);

  const clearDrag = useCallback(() => {
    pendingRef.current = null;
    draggingPathsRef.current = null;
    activeTreeDragPaths = null;
    dragOverKeyRef.current = null;
    setDraggingKeys(new Set());
    setDragOverKey(null);
  }, []);

  const onToggleDirectory = useCallback((path: string[]) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const key = pathKey(path);
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onOpenFileGuarded = useCallback(
    (path: string[]) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      onOpenFile(path);
    },
    [onOpenFile]
  );

  const onRowActivate = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, node: LocalDiskNode): boolean => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return false;
      }
      const key = pathKey(node.path);
      if (event.shiftKey) {
        const visible = flattenVisibleNodes(nodes, expandedPaths);
        const anchorKey = selectionAnchorKey ?? key;
        const anchorIndex = visible.findIndex(
          (entry) => pathKey(entry.path) === anchorKey
        );
        const targetIndex = visible.findIndex(
          (entry) => pathKey(entry.path) === key
        );
        if (anchorIndex >= 0 && targetIndex >= 0) {
          const start = Math.min(anchorIndex, targetIndex);
          const end = Math.max(anchorIndex, targetIndex);
          const next = new Set<string>();
          for (let i = start; i <= end; i++) {
            next.add(pathKey(visible[i]!.path));
          }
          setSelectedKeys(next);
        } else {
          setSelectedKeys(new Set([key]));
          setSelectionAnchorKey(key);
        }
        return false;
      }
      if (event.ctrlKey || event.metaKey) {
        setSelectedKeys((current) => {
          const next = new Set(current);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
        setSelectionAnchorKey(key);
        return false;
      }
      setSelectedKeys(new Set([key]));
      setSelectionAnchorKey(key);
      return true;
    },
    [expandedPaths, nodes, selectionAnchorKey]
  );

  const onPointerDownRow = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, node: LocalDiskNode) => {
      if (
        event.button !== 0 ||
        node.virtual ||
        renamingPathKey === pathKey(node.path)
      ) {
        return;
      }
      const key = pathKey(node.path);
      const current = selectedKeysRef.current;
      let dragPaths: string[][];
      if (current.has(key) && current.size > 1) {
        const visible = flattenVisibleNodes(nodes, expandedPaths);
        const byKey = new Map(
          visible.map((entry) => [pathKey(entry.path), entry] as const)
        );
        dragPaths = pruneNestedPaths(
          [...current]
            .map(parsePathKey)
            .filter((path) => byKey.get(pathKey(path))?.virtual !== true)
        );
        if (dragPaths.length === 0) {
          dragPaths = [node.path];
        }
      } else {
        dragPaths = [node.path];
      }
      pendingRef.current = {
        path: node.path,
        paths: dragPaths,
        x: event.clientX,
        y: event.clientY,
      };
    },
    [expandedPaths, nodes, renamingPathKey]
  );

  const handleContextMenu = useCallback(
    (
      event: ReactMouseEvent,
      target: { type: "file" | "directory"; path: string[]; virtual?: boolean }
    ) => {
      const key = pathKey(target.path);
      let paths: string[][];
      if (
        selectedKeysRef.current.has(key) &&
        selectedKeysRef.current.size > 1
      ) {
        paths = [...selectedKeysRef.current].map(parsePathKey);
      } else {
        setSelectedKeys(new Set([key]));
        setSelectionAnchorKey(key);
        paths = [target.path];
      }
      const visible = flattenVisibleNodes(nodes, expandedPaths);
      const byKey = new Map(
        visible.map((entry) => [pathKey(entry.path), entry] as const)
      );
      const selectedTargets = paths.map((path) => {
        const entry = byKey.get(pathKey(path));
        if (entry) {
          return {
            type: entry.type,
            path: entry.path,
            virtual: entry.virtual,
          };
        }
        if (
          path.length === target.path.length &&
          path.every((segment, index) => segment === target.path[index])
        ) {
          return target;
        }
        return { type: "file" as const, path };
      });
      onContextMenu(event, target, selectedTargets);
    },
    [expandedPaths, nodes, onContextMenu]
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending && draggingPathsRef.current === null) {
        const dx = event.clientX - pending.x;
        const dy = event.clientY - pending.y;
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return;
        }
        const paths = pending.paths;
        draggingPathsRef.current = paths;
        activeTreeDragPaths = paths;
        pendingRef.current = null;
        setDraggingKeys(new Set(paths.map((entry) => pathKey(entry))));
        suppressClickRef.current = true;
      }

      const fromPaths = draggingPathsRef.current;
      if (!fromPaths) {
        return;
      }

      event.preventDefault();
      const target = findDropTarget(event.clientX, event.clientY);
      let nextKey: string | null = null;
      if (target) {
        const toParent = dropParentForPaths(target.key, target.type, fromPaths);
        if (toParent !== null) {
          nextKey = target.type === "root" ? rootDropKey : target.key;
        }
      }
      if (dragOverKeyRef.current !== nextKey) {
        dragOverKeyRef.current = nextKey;
        setDragOverKey(nextKey);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const fromPaths = draggingPathsRef.current;
      if (!fromPaths) {
        pendingRef.current = null;
        return;
      }

      const target = findDropTarget(event.clientX, event.clientY);
      let toParent: string[] | null = null;
      if (target) {
        toParent = dropParentForPaths(target.key, target.type, fromPaths);
      }

      clearDrag();
      if (toParent !== null) {
        onMoveEntries(fromPaths, toParent);
      }
    };

    const onPointerCancel = () => {
      clearDrag();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (draggingPathsRef.current || pendingRef.current) {
          clearDrag();
          return;
        }
        setSelectedKeys(new Set());
        setSelectionAnchorKey(null);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [clearDrag, onMoveEntries]);

  useEffect(
    () => () => {
      activeTreeDragPaths = null;
    },
    []
  );

  return (
    <ul
      className={`files-tree${dragOverKey === rootDropKey ? " files-tree--drop-target" : ""}${draggingKeys.size > 0 ? " files-tree--dragging" : ""}`}
      data-tree-root=""
    >
      {nodes.map((node) => (
        <TreeNode
          activeFileName={activeFileName}
          depth={0}
          draggingKeys={draggingKeys}
          dragOverKey={dragOverKey}
          expandedPaths={expandedPaths}
          key={pathKey(node.path)}
          node={node}
          objectListNames={objectListNames}
          onBeginRename={onBeginRename}
          onCancelRename={onCancelRename}
          onCommitRename={onCommitRename}
          onContextMenu={handleContextMenu}
          onOpenFile={onOpenFileGuarded}
          onPointerDownRow={onPointerDownRow}
          onRegenerateObjectLists={onRegenerateObjectLists}
          onRowActivate={onRowActivate}
          onToggleDirectory={onToggleDirectory}
          regenerateObjectListsLabel={regenerateObjectListsLabel}
          renamingPathKey={renamingPathKey}
          selectedKeys={selectedKeys}
        />
      ))}
    </ul>
  );
}
