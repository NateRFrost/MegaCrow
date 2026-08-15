import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type FilesContextTarget =
  | { type: "file"; path: string[] }
  | { type: "directory"; path: string[] };

export interface FilesContextMenuState {
  source: "local" | "opfs";
  target: FilesContextTarget;
  x: number;
  y: number;
}

interface Props {
  canPaste: boolean;
  menu: FilesContextMenuState | null;
  onClose: () => void;
  onCopy: (path: string[], source: "local" | "opfs") => void;
  onCopyPath: (path: string[], source: "local" | "opfs") => void;
  onDelete: (path: string[], source: "local" | "opfs") => void;
  onNewFile: (parentPath: string[], source: "local" | "opfs") => void;
  onPaste: (target: FilesContextTarget, source: "local" | "opfs") => void;
  onRename: (path: string[], source: "local" | "opfs") => void;
}

const MENU_MIN_WIDTH = 160;

export function FilesContextMenu({
  menu,
  canPaste,
  onClose,
  onNewFile,
  onRename,
  onDelete,
  onCopy,
  onPaste,
  onCopyPath,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, []);

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
      if (event.key !== "Escape") {
        return;
      }
      if (confirmDelete) {
        setConfirmDelete(false);
        return;
      }
      onClose();
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
  }, [menu, onClose, confirmDelete]);

  if (!menu) {
    return null;
  }

  const isFile = menu.target.type === "file";
  const { source } = menu;
  const fileName = menu.target.path.at(-1) ?? "file";

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
      {menu.target.type === "directory" ? (
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
      ) : null}
      {isFile ? (
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
      {canPaste ? (
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
      {isFile ? (
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
      {isFile ? (
        confirmDelete ? (
          <div
            aria-label={`Confirm delete ${fileName}`}
            className="files-context-menu-confirm"
            role="group"
          >
            <p className="files-context-menu-confirm-text">
              Delete &ldquo;{fileName}&rdquo;?
            </p>
            <div className="files-context-menu-confirm-actions">
              <button
                className="files-context-menu-confirm-btn"
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="files-context-menu-confirm-btn files-context-menu-confirm-btn--danger"
                onClick={() => {
                  onDelete(menu.target.path, source);
                  onClose();
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            className="files-context-menu-item files-context-menu-item--danger"
            onClick={() => setConfirmDelete(true)}
            role="menuitem"
            type="button"
          >
            Delete
          </button>
        )
      ) : null}
    </div>,
    document.body
  );
}
