import {
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

/** Custom DnD type for in-tree moves (must be lowercase for Chromium). */
export const MEGACROW_TREE_PATH_MIME = "application/x-megacrow-tree-path";

const SCROLL_EDGE_PX = 44;
const SCROLL_MAX_SPEED = 22;

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
    target: { type: "file" | "directory"; path: string[] }
  ) => void;
  /** Move `fromPath` into `toParentPath` (empty = workspace root). */
  onMoveEntry: (fromPath: string[], toParentPath: string[]) => void;
  onOpenFile: (path: string[]) => void;
  renamingPathKey: string | null;
}

type DragPreviewKind = "file" | "folder" | "object-lists" | "object-list-file";

interface DragPreviewState {
  kind: DragPreviewKind;
  label: string;
  width: number;
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

/** Object list tables — folder with list rows. */
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

/** Recognized object list file — same green accent as the object_lists folder. */
function ObjectListFileGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="files-glyph files-glyph--object-list-file"
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

function DragPreviewGlyph({ kind }: { kind: DragPreviewKind }) {
  switch (kind) {
    case "folder":
      return <FolderGlyph open={false} />;
    case "object-lists":
      return <ObjectListsFolderGlyph />;
    case "object-list-file":
      return <ObjectListFileGlyph />;
    default:
      return <FileGlyph />;
  }
}

function parseDragPath(event: ReactDragEvent): string[] | null {
  const raw = event.dataTransfer.getData(MEGACROW_TREE_PATH_MIME);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !(
        Array.isArray(parsed) &&
        parsed.every((segment) => typeof segment === "string")
      )
    ) {
      return null;
    }
    return parsed as string[];
  } catch {
    return null;
  }
}

function hasTreeDrag(event: ReactDragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes(MEGACROW_TREE_PATH_MIME);
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

/** Destination parent folder for a drop on a node (files → their parent). */
function dropParentForNode(
  node: LocalDiskNode,
  fromPath: string[] | null
): string[] | null {
  const parent = node.type === "directory" ? node.path : node.path.slice(0, -1);
  if (!fromPath) {
    return parent;
  }
  // Cannot drop a folder onto itself.
  if (node.type === "directory" && isSamePath(fromPath, node.path)) {
    return null;
  }
  // Cannot move a folder into one of its descendants.
  if (isPathPrefix(fromPath, parent)) {
    return null;
  }
  return parent;
}

function transparentDragImage(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
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
  suppressClickRef,
  onDragOverTarget,
  onTreeDragStart,
  onTreeDragEnd,
  onToggleDirectory,
  onOpenFile,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  onMoveEntry,
}: {
  node: LocalDiskNode;
  depth: number;
  activeFileName: string | null;
  dragOverKey: string | null;
  draggingKey: string | null;
  expandedPaths: Set<string>;
  objectListNames: readonly string[];
  renamingPathKey: string | null;
  suppressClickRef: { current: boolean };
  onDragOverTarget: (key: string | null) => void;
  onTreeDragStart: (
    event: ReactDragEvent<HTMLButtonElement>,
    node: LocalDiskNode,
    kind: DragPreviewKind
  ) => void;
  onTreeDragEnd: () => void;
  onToggleDirectory: (path: string[]) => void;
  onOpenFile: (path: string[]) => void;
  onBeginRename: (path: string[]) => void;
  onCommitRename: (path: string[], newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (
    event: ReactMouseEvent,
    target: { type: "file" | "directory"; path: string[] }
  ) => void;
  onMoveEntry: (fromPath: string[], toParentPath: string[]) => void;
}) {
  const displayPath = formatLocalDiskPath(node.path);
  const nodeKey = pathKey(node.path);
  const isExpanded = expandedPaths.has(nodeKey);
  const isRenaming = renamingPathKey === nodeKey;
  const isDragging = draggingKey === nodeKey;
  const isDropTarget = dragOverKey === nodeKey && !isDragging;
  const indent = { "--files-depth": String(depth) } as CSSProperties;

  const onDragOver = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (draggingKey === nodeKey) {
      onDragOverTarget(null);
      return;
    }
    onDragOverTarget(nodeKey);
  };

  const onDragLeave = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    onDragOverTarget(null);
  };

  const onDrop = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onDragOverTarget(null);
    const fromPath = parseDragPath(event);
    if (!fromPath) {
      return;
    }
    const toParent = dropParentForNode(node, fromPath);
    if (!toParent) {
      return;
    }
    onMoveEntry(fromPath, toParent);
  };

  if (node.type === "file") {
    const isActive =
      activeFileName !== null &&
      activeFileName.localeCompare(displayPath, undefined, {
        sensitivity: "accent",
      }) === 0;
    const recognizedObjectList =
      isObjectListsPath(node.path) &&
      isRecognizedObjectListName(node.name, objectListNames);
    const previewKind: DragPreviewKind = recognizedObjectList
      ? "object-list-file"
      : "file";

    return (
      <li className="files-tree-node">
        {isRenaming ? (
          <div
            className={`files-row-btn files-row-btn--renaming${isActive ? " files-row-btn--active" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}`}
            style={indent}
          >
            <span aria-hidden="true" className="files-chevron-spacer" />
            {recognizedObjectList ? <ObjectListFileGlyph /> : <FileGlyph />}
            <FilesRenameInput
              initialName={node.name}
              onCancel={onCancelRename}
              onCommit={(value) => onCommitRename(node.path, value)}
            />
          </div>
        ) : (
          <button
            className={`files-row-btn${isActive ? " files-row-btn--active" : ""}${recognizedObjectList ? " files-row-btn--object-list-file" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
            draggable
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              onOpenFile(node.path);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              onContextMenu(event, { type: "file", path: node.path });
            }}
            onDragEnd={onTreeDragEnd}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDragStart={(event) => onTreeDragStart(event, node, previewKind)}
            onDrop={onDrop}
            onKeyDown={(event) => {
              if (event.key === "F2") {
                event.preventDefault();
                onBeginRename(node.path);
              }
            }}
            style={indent}
            title={displayPath}
            type="button"
          >
            <span aria-hidden="true" className="files-chevron-spacer" />
            {recognizedObjectList ? <ObjectListFileGlyph /> : <FileGlyph />}
            <span className="files-row-label">{node.name}</span>
          </button>
        )}
      </li>
    );
  }

  const isObjectLists = isObjectListsDirectoryName(node.name);
  const previewKind: DragPreviewKind = isObjectLists
    ? "object-lists"
    : "folder";

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
        <button
          aria-expanded={isExpanded}
          className={`files-row-btn files-row-btn--folder${isObjectLists ? " files-row-btn--object-lists" : ""}${isDragging ? " files-row-btn--dragging" : ""}${isDropTarget ? " files-row-btn--drop-target" : ""}`}
          draggable
          onClick={() => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            onToggleDirectory(node.path);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu(event, { type: "directory", path: node.path });
          }}
          onDragEnd={onTreeDragEnd}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDragStart={(event) => onTreeDragStart(event, node, previewKind)}
          onDrop={onDrop}
          onKeyDown={(event) => {
            if (event.key === "F2") {
              event.preventDefault();
              onBeginRename(node.path);
            }
          }}
          style={indent}
          title={displayPath}
          type="button"
        >
          <ChevronGlyph open={isExpanded} />
          {isObjectLists ? (
            <ObjectListsFolderGlyph />
          ) : (
            <FolderGlyph open={isExpanded} />
          )}
          <span className="files-row-label">{node.name}</span>
        </button>
      )}
      {isExpanded && isObjectLists && (node.children?.length ?? 0) === 0 ? (
        <p
          className="files-object-lists-hint"
          style={
            {
              "--files-depth": String(depth + 1),
            } as CSSProperties
          }
        >
          No object lists provided, MegaCrow will use the default lists
        </p>
      ) : null}
      {isExpanded && node.children && node.children.length > 0 ? (
        <ul className="files-tree">
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
              onDragOverTarget={onDragOverTarget}
              onMoveEntry={onMoveEntry}
              onOpenFile={onOpenFile}
              onToggleDirectory={onToggleDirectory}
              onTreeDragEnd={onTreeDragEnd}
              onTreeDragStart={onTreeDragStart}
              renamingPathKey={renamingPathKey}
              suppressClickRef={suppressClickRef}
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
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const suppressClickRef = useRef(false);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const dragPreviewElRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef<number | null>(null);
  const rootDropKey = "";

  const placeDragPreview = useCallback((x: number, y: number) => {
    const el = dragPreviewElRef.current;
    if (!el) {
      return;
    }
    el.style.transform = `translate3d(${x + 10}px, ${y + 8}px, 0)`;
  }, []);

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

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const tickAutoScroll = useCallback(() => {
    const scrollEl = scrollParentRef.current;
    if (!scrollEl) {
      autoScrollRafRef.current = null;
      return;
    }
    const rect = scrollEl.getBoundingClientRect();
    const { y } = pointerRef.current;
    let delta = 0;
    if (y < rect.top + SCROLL_EDGE_PX) {
      const intensity = Math.min(
        1,
        (rect.top + SCROLL_EDGE_PX - y) / SCROLL_EDGE_PX
      );
      delta = -SCROLL_MAX_SPEED * intensity;
    } else if (y > rect.bottom - SCROLL_EDGE_PX) {
      const intensity = Math.min(
        1,
        (y - (rect.bottom - SCROLL_EDGE_PX)) / SCROLL_EDGE_PX
      );
      delta = SCROLL_MAX_SPEED * intensity;
    }
    if (delta !== 0) {
      scrollEl.scrollTop += delta;
    }
    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) {
      return;
    }
    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [tickAutoScroll]);

  useEffect(() => {
    if (!draggingKey) {
      stopAutoScroll();
      return;
    }

    // Capture phase: row/root handlers call stopPropagation(), so a bubble
    // listener on document never sees dragover while over the tree.
    const onDragOverDocument = (event: DragEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      placeDragPreview(event.clientX, event.clientY);
      startAutoScroll();
    };

    const onWheel = (event: WheelEvent) => {
      const scrollEl = scrollParentRef.current;
      if (!scrollEl) {
        return;
      }
      // HTML5 DnD blocks native scroll; apply wheel to the tree manually.
      const line =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? scrollEl.clientHeight
            : 1;
      scrollEl.scrollTop += event.deltaY * line;
      event.preventDefault();
    };

    document.addEventListener("dragover", onDragOverDocument, true);
    // Wheel during drag often targets window/body, not the scroll container.
    window.addEventListener("wheel", onWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("dragover", onDragOverDocument, true);
      window.removeEventListener("wheel", onWheel, true);
      stopAutoScroll();
    };
  }, [draggingKey, placeDragPreview, startAutoScroll, stopAutoScroll]);

  const onToggleDirectory = useCallback((path: string[]) => {
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

  const onDragOverTarget = useCallback((key: string | null) => {
    setDragOverKey((prev) => (prev === key ? prev : key));
  }, []);

  const onTreeDragStart = useCallback(
    (
      event: ReactDragEvent<HTMLButtonElement>,
      node: LocalDiskNode,
      kind: DragPreviewKind
    ) => {
      if (renamingPathKey === pathKey(node.path)) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(
        MEGACROW_TREE_PATH_MIME,
        JSON.stringify(node.path)
      );
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setDragImage(transparentDragImage(), 0, 0);

      const rect = event.currentTarget.getBoundingClientRect();
      const scrollParent = event.currentTarget.closest(
        ".files-section-scroll"
      ) as HTMLElement | null;
      scrollParentRef.current = scrollParent;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      suppressClickRef.current = false;
      setDraggingKey(pathKey(node.path));
      setDragPreview({
        kind,
        label: node.name,
        width: Math.max(120, Math.round(rect.width)),
      });
      // Place on next paint once the portal mounts.
      requestAnimationFrame(() => {
        placeDragPreview(event.clientX, event.clientY);
      });
      startAutoScroll();
    },
    [placeDragPreview, renamingPathKey, startAutoScroll]
  );

  const onTreeDragEnd = useCallback(() => {
    suppressClickRef.current = true;
    setDraggingKey(null);
    setDragOverKey(null);
    setDragPreview(null);
    scrollParentRef.current = null;
    stopAutoScroll();
  }, [stopAutoScroll]);

  const onRootDragOver = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDragOverKey((prev) => (prev === rootDropKey ? prev : rootDropKey));
  };

  const onRootDragLeave = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    setDragOverKey(null);
  };

  const onRootDrop = (event: ReactDragEvent) => {
    if (!hasTreeDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setDragOverKey(null);
    const fromPath = parseDragPath(event);
    if (!fromPath || fromPath.length === 0) {
      return;
    }
    // Already at root.
    if (fromPath.length === 1) {
      return;
    }
    onMoveEntry(fromPath, []);
  };

  return (
    <>
      <ul
        className={`files-tree${dragOverKey === rootDropKey ? " files-tree--drop-target" : ""}`}
        onDragLeave={onRootDragLeave}
        onDragOver={onRootDragOver}
        onDrop={onRootDrop}
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
            onDragOverTarget={onDragOverTarget}
            onMoveEntry={onMoveEntry}
            onOpenFile={onOpenFile}
            onToggleDirectory={onToggleDirectory}
            onTreeDragEnd={onTreeDragEnd}
            onTreeDragStart={onTreeDragStart}
            renamingPathKey={renamingPathKey}
            suppressClickRef={suppressClickRef}
          />
        ))}
      </ul>
      {dragPreview
        ? createPortal(
            <div
              aria-hidden="true"
              className={`files-drag-preview${
                dragPreview.kind === "folder" ||
                dragPreview.kind === "object-lists"
                  ? " files-drag-preview--folder"
                  : ""
              }${
                dragPreview.kind === "object-lists"
                  ? " files-drag-preview--object-lists"
                  : ""
              }${
                dragPreview.kind === "object-list-file"
                  ? " files-drag-preview--object-list-file"
                  : ""
              }`}
              ref={dragPreviewElRef}
              style={{ width: dragPreview.width }}
            >
              <DragPreviewGlyph kind={dragPreview.kind} />
              <span className="files-row-label">{dragPreview.label}</span>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
