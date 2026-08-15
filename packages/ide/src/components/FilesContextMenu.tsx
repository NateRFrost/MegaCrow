import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fileManagerRevealLabel } from "../lib/revealInFileManager";

export type FilesContextTarget =
  | { type: "file"; path: string[] }
  | { type: "directory"; path: string[] };

export type FilesContextSource = "local" | "opfs" | "builds";

export interface FilesContextMenuState {
  source: FilesContextSource;
  target: FilesContextTarget;
  x: number;
  y: number;
}

interface Props {
  canPaste: boolean;
  menu: FilesContextMenuState | null;
  onClose: () => void;
  onCopy: (path: string[], source: FilesContextSource) => void;
  onCopyPath: (path: string[], source: FilesContextSource) => void;
  /** Opens delete confirmation (does not delete immediately). */
  onDelete: (target: FilesContextTarget, source: FilesContextSource) => void;
  onNewFile: (parentPath: string[], source: FilesContextSource) => void;
  onNewFolder?: (parentPath: string[], source: FilesContextSource) => void;
  onPaste: (target: FilesContextTarget, source: FilesContextSource) => void;
  onRename: (path: string[], source: FilesContextSource) => void;
  /** When set, show Reveal for local/builds paths (Tauri). */
  onReveal?: (path: string[], source: FilesContextSource) => void;
}

const MENU_MIN_WIDTH = 160;

export function FilesContextMenu({
  menu,
  canPaste,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onPaste,
  onCopyPath,
  onReveal,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const revealLabel = fileManagerRevealLabel();

  useLayoutEffect(() => {
    if (!(menu && panelRef.current)) {
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const left = Math.min(menu.x, maxLeft);
    const top = Math.min(menu.y, maxTop);
    panelRef.current.style.left = `${left}px`;
    panelRef.current.style.top = `${top}px`;
  }, [menu]);

  useEffect(() => {
    if (!menu) {
      return;
    }

    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const onScroll = () => {
      onClose();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  const isFile = menu.target.type === "file";
  const { source } = menu;
  const canReveal =
    onReveal !== undefined && (source === "local" || source === "builds");
  const canRename = source !== "builds" && (isFile || source === "local");
  const canDelete = isFile || source === "local" || source === "builds";
  const showNewActions = menu.target.type === "directory" && source === "local";

  return createPortal(
    <div
      className="files-context-menu"
      ref={panelRef}
      role="menu"
      style={{
        position: "fixed",
        left: menu.x,
        top: menu.y,
        minWidth: MENU_MIN_WIDTH,
      }}
    >
      {showNewActions ? (
        <>
          <button
            className="files-context-menu-item"
            onClick={() => {
              onNewFile(menu.target.path, source);
              onClose();
            }}
            role="menuitem"
            type="button"
          >
            New File
          </button>
          {onNewFolder ? (
            <button
              className="files-context-menu-item"
              onClick={() => {
                onNewFolder(menu.target.path, source);
                onClose();
              }}
              role="menuitem"
              type="button"
            >
              New Folder
            </button>
          ) : null}
        </>
      ) : null}
      {isFile && source !== "builds" ? (
        <button
          className="files-context-menu-item"
          onClick={() => {
            onCopy(menu.target.path, source);
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          Copy
        </button>
      ) : null}
      {canPaste && source !== "builds" ? (
        <button
          className="files-context-menu-item"
          onClick={() => {
            onPaste(menu.target, source);
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          Paste
        </button>
      ) : null}
      {canRename ? (
        <button
          className="files-context-menu-item"
          onClick={() => {
            onRename(menu.target.path, source);
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          Rename
        </button>
      ) : null}
      <button
        className="files-context-menu-item"
        onClick={() => {
          onCopyPath(menu.target.path, source);
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        Copy Path
      </button>
      {canReveal ? (
        <button
          className="files-context-menu-item"
          onClick={() => {
            onReveal(menu.target.path, source);
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          {revealLabel}
        </button>
      ) : null}
      {canDelete ? (
        <button
          className="files-context-menu-item files-context-menu-item--danger"
          onClick={() => {
            onDelete(menu.target, source);
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          Delete
        </button>
      ) : null}
    </div>,
    document.body
  );
}
