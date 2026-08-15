import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  formatLocalDiskPath,
  type LocalDiskNode,
  pathKey,
} from "../lib/localFolder";
import { isObjectListsDirectoryName } from "../lib/objectListsPath";
import { FilesRenameInput } from "./FilesRenameInput";

interface Props {
  activeFileName: string | null;
  /** Path keys that should stay expanded (e.g. parent of a newly created file). */
  ensureExpandedKeys?: readonly string[];
  nodes: LocalDiskNode[];
  onBeginRename: (path: string[]) => void;
  onCancelRename: () => void;
  onCommitRename: (path: string[], newName: string) => void;
  onContextMenu: (
    event: ReactMouseEvent,
    target: { type: "file" | "directory"; path: string[] }
  ) => void;
  onOpenFile: (path: string[]) => void;
  renamingPathKey: string | null;
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

function TreeNode({
  node,
  depth,
  activeFileName,
  expandedPaths,
  renamingPathKey,
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
  expandedPaths: Set<string>;
  renamingPathKey: string | null;
  onToggleDirectory: (path: string[]) => void;
  onOpenFile: (path: string[]) => void;
  onBeginRename: (path: string[]) => void;
  onCommitRename: (path: string[], newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (
    event: ReactMouseEvent,
    target: { type: "file" | "directory"; path: string[] }
  ) => void;
}) {
  const displayPath = formatLocalDiskPath(node.path);
  const nodeKey = pathKey(node.path);
  const isExpanded = expandedPaths.has(nodeKey);
  const isRenaming = renamingPathKey === nodeKey;
  const indent = { "--files-depth": String(depth) } as CSSProperties;

  if (node.type === "file") {
    const isActive =
      activeFileName !== null &&
      activeFileName.localeCompare(displayPath, undefined, {
        sensitivity: "accent",
      }) === 0;

    return (
      <li className="files-tree-node">
        {isRenaming ? (
          <div
            className={`files-row-btn files-row-btn--renaming${isActive ? " files-row-btn--active" : ""}`}
            style={indent}
          >
            <span aria-hidden="true" className="files-chevron-spacer" />
            <FileGlyph />
            <FilesRenameInput
              initialName={node.name}
              onCancel={onCancelRename}
              onCommit={(value) => onCommitRename(node.path, value)}
            />
          </div>
        ) : (
          <button
            className={`files-row-btn${isActive ? " files-row-btn--active" : ""}`}
            onClick={() => onOpenFile(node.path)}
            onContextMenu={(event) => {
              event.preventDefault();
              onContextMenu(event, { type: "file", path: node.path });
            }}
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
            <FileGlyph />
            <span className="files-row-label">{node.name}</span>
          </button>
        )}
      </li>
    );
  }

  const isObjectLists = isObjectListsDirectoryName(node.name);

  return (
    <li className="files-tree-node files-tree-node--branch">
      <button
        aria-expanded={isExpanded}
        className={`files-row-btn files-row-btn--folder${isObjectLists ? " files-row-btn--object-lists" : ""}`}
        onClick={() => onToggleDirectory(node.path)}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu(event, { type: "directory", path: node.path });
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
      {isExpanded && node.children && node.children.length > 0 ? (
        <ul className="files-tree">
          {node.children.map((child) => (
            <TreeNode
              activeFileName={activeFileName}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              key={pathKey(child.path)}
              node={child}
              onBeginRename={onBeginRename}
              onCancelRename={onCancelRename}
              onCommitRename={onCommitRename}
              onContextMenu={onContextMenu}
              onOpenFile={onOpenFile}
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
  onOpenFile,
  renamingPathKey,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  ensureExpandedKeys = [],
}: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set()
  );

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

  return (
    <ul className="files-tree">
      {nodes.map((node) => (
        <TreeNode
          activeFileName={activeFileName}
          depth={0}
          expandedPaths={expandedPaths}
          key={pathKey(node.path)}
          node={node}
          onBeginRename={onBeginRename}
          onCancelRename={onCancelRename}
          onCommitRename={onCommitRename}
          onContextMenu={onContextMenu}
          onOpenFile={onOpenFile}
          onToggleDirectory={onToggleDirectory}
          renamingPathKey={renamingPathKey}
        />
      ))}
    </ul>
  );
}
