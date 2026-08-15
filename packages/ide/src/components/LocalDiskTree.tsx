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

let activeTreeDragPath: string[] | null = null;

export function isMegacrowTreeDragActive(): boolean {
  return activeTreeDragPath !== null;
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
    target: { type: "file" | "directory"; path: string[]; virtual?: boolean }
  ) => void;
  /** Move `fromPath` into `toParentPath` (empty = workspace root). */
  onMoveEntry: (fromPath: string[], toParentPath: string[]) => void;
  onOpenFile: (path: string[]) => void;
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
  draggingKey,
  expandedPaths,
  objectListNames,
  renamingPathKey,
  onPointerDownRow,
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
  draggingKey: string | null;
  expandedPaths: Set<string>;
  objectListNames: readonly string[];
  renamingPathKey: string | null;
  onPointerDownRow: (
    event: ReactPointerEvent<HTMLDivElement>,
    node: LocalDiskNode
  ) => void;
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
  const isDragging = draggingKey === nodeKey;
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
            className={`files-row-btn files-row-btn--renaming${isActive ? " files-row-btn--active" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}${isVirtual ? " files-row-btn--virtual" : ""}`}
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
            className={`files-row-btn${isActive ? " files-row-btn--active" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}${isVirtual ? " files-row-btn--virtual" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
            data-tree-drop="file"
            data-tree-path={nodeKey}
            onClick={() => onOpenFile(node.path)}
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
          className={`files-row-btn files-row-btn--folder files-row-btn--renaming${isObjectLists ? " files-row-btn--object-lists" : ""}`}
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
          className={`files-row-btn files-row-btn--folder${isObjectLists ? " files-row-btn--object-lists" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
          data-tree-drop="directory"
          data-tree-path={nodeKey}
          onClick={() => onToggleDirectory(node.path)}
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
              draggingKey={draggingKey}
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
              onToggleDirectory={onToggleDirectory}
              renamingPathKey={renamingPathKey}
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
  renamingPathKey,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  onMoveEntry,
  ensureExpandedKeys = [],
}: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set()
  );
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const pendingRef = useRef<{
    path: string[];
    x: number;
    y: number;
  } | null>(null);
  const draggingPathRef = useRef<string[] | null>(null);
  const dragOverKeyRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const rootDropKey = "";

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
    draggingPathRef.current = null;
    activeTreeDragPath = null;
    dragOverKeyRef.current = null;
    setDraggingKey(null);
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

  const onPointerDownRow = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, node: LocalDiskNode) => {
      if (event.button !== 0 || renamingPathKey === pathKey(node.path)) {
        return;
      }
      pendingRef.current = {
        path: node.path,
        x: event.clientX,
        y: event.clientY,
      };
    },
    [renamingPathKey]
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending && draggingPathRef.current === null) {
        const dx = event.clientX - pending.x;
        const dy = event.clientY - pending.y;
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return;
        }
        draggingPathRef.current = pending.path;
        activeTreeDragPath = pending.path;
        pendingRef.current = null;
        setDraggingKey(pathKey(pending.path));
        suppressClickRef.current = true;
      }

      const fromPath = draggingPathRef.current;
      if (!fromPath) {
        return;
      }

      event.preventDefault();
      const target = findDropTarget(event.clientX, event.clientY);
      let nextKey: string | null = null;
      if (target) {
        const toParent = dropParentForPathKey(
          target.key,
          target.type,
          fromPath
        );
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
      const fromPath = draggingPathRef.current;
      if (!fromPath) {
        pendingRef.current = null;
        return;
      }

      const target = findDropTarget(event.clientX, event.clientY);
      let toParent: string[] | null = null;
      if (target) {
        toParent = dropParentForPathKey(target.key, target.type, fromPath);
      }

      clearDrag();
      if (toParent !== null) {
        onMoveEntry(fromPath, toParent);
      }
    };

    const onPointerCancel = () => {
      clearDrag();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearDrag();
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
  }, [clearDrag, onMoveEntry]);

  // Keep module flag in sync if the tree unmounts mid-drag.
  useEffect(
    () => () => {
      activeTreeDragPath = null;
    },
    []
  );

  return (
    <ul
      className={`files-tree${dragOverKey === rootDropKey ? " files-tree--drop-target" : ""}${draggingKey ? " files-tree--dragging" : ""}`}
      data-tree-root=""
    >
      {nodes.map((node) => (
        <TreeNode
          activeFileName={activeFileName}
          depth={0}
          draggingKey={draggingKey}
          dragOverKey={dragOverKey}
          expandedPaths={expandedPaths}
          key={pathKey(node.path)}
          node={node}
          objectListNames={objectListNames}
          onBeginRename={onBeginRename}
          onCancelRename={onCancelRename}
          onCommitRename={onCommitRename}
          onContextMenu={onContextMenu}
          onOpenFile={onOpenFileGuarded}
          onPointerDownRow={onPointerDownRow}
          onToggleDirectory={onToggleDirectory}
          renamingPathKey={renamingPathKey}
        />
      ))}
    </ul>
  );
}
