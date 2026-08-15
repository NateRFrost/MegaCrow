import {
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { writeClipboardText } from "../lib/clipboard";
import type { MegaloDiagnostic } from "../lib/diagnostics";

interface Props {
  diagnostics: MegaloDiagnostic[];
  height?: number;
  onClose: () => void;
  onNavigate: (line: number, column: number) => void;
}

interface ContextMenuState {
  text: string;
  x: number;
  y: number;
}

function severityOf(d: MegaloDiagnostic): "error" | "warning" {
  return d.severity === "warning" ? "warning" : "error";
}

function formatDiagnosticCopy(diagnostic: MegaloDiagnostic): string {
  if (diagnostic.trayOnly) {
    return diagnostic.message;
  }
  return `Ln ${diagnostic.line}, Col ${diagnostic.column}: ${diagnostic.message}`;
}

function SeverityIcon({ severity }: { severity: "error" | "warning" }) {
  if (severity === "warning") {
    return (
      <svg
        aria-hidden="true"
        className="diagnostics-tray-icon diagnostics-tray-icon--warn"
        viewBox="0 0 16 16"
      >
        <path
          d="M8.86 2.49a1 1 0 0 0-1.72 0L1.2 12.26A1 1 0 0 0 2.06 13.8h11.88a1 1 0 0 0 .86-1.54L8.86 2.49ZM8 5.6a.7.7 0 0 1 .7.7v2.8a.7.7 0 1 1-1.4 0V6.3A.7.7 0 0 1 8 5.6Zm0 6.3a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="diagnostics-tray-icon diagnostics-tray-icon--error"
      viewBox="0 0 16 16"
    >
      <path
        d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM5.4 5.4a.75.75 0 0 1 1.06 0L8 6.94l1.54-1.54a.75.75 0 1 1 1.06 1.06L9.06 8l1.54 1.54a.75.75 0 1 1-1.06 1.06L8 9.06l-1.54 1.54a.75.75 0 1 1-1.06-1.06L6.94 8 5.4 6.46a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DiagnosticsContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!(menu && panelRef.current)) {
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    panelRef.current.style.left = `${Math.min(menu.x, maxLeft)}px`;
    panelRef.current.style.top = `${Math.min(menu.y, maxTop)}px`;
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

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return createPortal(
    <div
      className="files-context-menu"
      ref={panelRef}
      role="menu"
      style={{
        position: "fixed",
        left: menu.x,
        top: menu.y,
        minWidth: 120,
      }}
    >
      <button
        className="files-context-menu-item"
        onClick={() => {
          void writeClipboardText(menu.text);
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        Copy
      </button>
    </div>,
    document.body
  );
}

export function DiagnosticsTray({
  diagnostics,
  onNavigate,
  onClose,
  height,
}: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const errorCount = diagnostics.filter(
    (d) => severityOf(d) === "error"
  ).length;
  const warningCount = diagnostics.length - errorCount;

  const sorted = [...diagnostics].sort((a, b) => {
    if (a.trayOnly !== b.trayOnly) {
      return a.trayOnly ? 1 : -1;
    }
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.column - b.column;
  });

  const onItemContextMenu = (
    event: MouseEvent,
    diagnostic: MegaloDiagnostic
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      text: formatDiagnosticCopy(diagnostic),
    });
  };

  return (
    <div
      aria-label="Problems"
      className="diagnostics-tray"
      role="region"
      style={height === undefined ? undefined : { height }}
    >
      <div className="diagnostics-tray-header">
        <div className="diagnostics-tray-title">
          <span>Problems</span>
          <span className="diagnostics-tray-counts">
            {errorCount > 0 && (
              <span className="diagnostics-tray-count diagnostics-tray-count--error">
                {errorCount} error{errorCount === 1 ? "" : "s"}
              </span>
            )}
            {warningCount > 0 && (
              <span className="diagnostics-tray-count diagnostics-tray-count--warn">
                {warningCount} warning{warningCount === 1 ? "" : "s"}
              </span>
            )}
            {diagnostics.length === 0 && (
              <span className="diagnostics-tray-count">No problems</span>
            )}
          </span>
        </div>
        <button
          aria-label="Close problems"
          className="diagnostics-tray-close"
          onClick={onClose}
          title="Close"
          type="button"
        >
          ×
        </button>
      </div>
      <ul className="diagnostics-tray-list">
        {sorted.length === 0 ? (
          <li className="diagnostics-tray-empty">No problems detected.</li>
        ) : (
          sorted.map((diagnostic, index) => {
            const severity = severityOf(diagnostic);
            const canNavigate = !diagnostic.trayOnly;
            return (
              <li
                key={`${diagnostic.trayOnly ? "tray" : `${diagnostic.line}:${diagnostic.column}`}:${index}`}
              >
                <button
                  aria-disabled={!canNavigate}
                  className={`diagnostics-tray-item diagnostics-tray-item--${severity}${canNavigate ? "" : " diagnostics-tray-item--no-nav"}`}
                  onClick={() => {
                    if (canNavigate) {
                      onNavigate(diagnostic.line, diagnostic.column);
                    }
                  }}
                  onContextMenu={(event) =>
                    onItemContextMenu(event, diagnostic)
                  }
                  type="button"
                >
                  <SeverityIcon severity={severity} />
                  <span className="diagnostics-tray-message">
                    {diagnostic.message}
                  </span>
                  {canNavigate ? (
                    <span className="diagnostics-tray-location">
                      Ln {diagnostic.line}, Col {diagnostic.column}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
      <DiagnosticsContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
