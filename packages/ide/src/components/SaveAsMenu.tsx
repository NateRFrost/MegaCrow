import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { GametypeSaveFormat } from "../lib/megaloShim";

interface SaveOption {
  description: string;
  format: GametypeSaveFormat;
  label: string;
}

const SAVE_OPTIONS: SaveOption[] = [
  {
    format: "mglo",
    label: ".mglo",
    description:
      "Hot reload and maps/megalo variants. Smallest gametype file format.",
  },
  {
    format: "gvar",
    label: "gvar",
    description:
      "BLF format for Xbox 360 matchmaking. Load in debug builds with net_load_and_use_game_variant.",
  },
  {
    format: "mpvr",
    label: "mpvr",
    description:
      "Standard BLF format for in-game saves, File Share, and Xbox/PC gametypes.",
  },
  {
    format: "asq",
    label: "Autosave Queue",
    description:
      "Save the gametype as an Autosave Queue file. You can place these files in your autosave format to have them appear in your Recent Games list.",
  },
];

const PANEL_WIDTH = 320;

interface Props {
  disabled?: boolean;
  onSave: (format: GametypeSaveFormat) => void;
}

export function SaveAsMenu({ disabled = false, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(8, rect.right - PANEL_WIDTH),
      Math.max(8, window.innerWidth - PANEL_WIDTH - 8)
    );
    const nextTop = rect.bottom + 4;
    setPanelPos((prev) =>
      prev.top === nextTop && prev.left === nextLeft
        ? prev
        : { top: nextTop, left: nextLeft }
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const handleSave = (format: GametypeSaveFormat) => {
    setOpen(false);
    onSave(format);
  };

  return (
    <div className="save-as-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="toolbar-btn save-as-menu-trigger"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        Export
        <svg
          aria-hidden="true"
          className="save-as-menu-chevron"
          viewBox="0 0 16 16"
        >
          <path
            d="M4.5 6.2 8 9.7l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              aria-label="Export format"
              className="save-as-menu-panel"
              ref={panelRef}
              role="menu"
              style={{
                top: panelPos.top,
                left: panelPos.left,
                width: Math.min(window.innerWidth - 24, PANEL_WIDTH),
              }}
            >
              <p className="save-as-menu-title">Export as</p>
              {SAVE_OPTIONS.map((option) => (
                <button
                  className="save-as-menu-item"
                  key={option.format}
                  onClick={() => handleSave(option.format)}
                  role="menuitem"
                  type="button"
                >
                  <span className="save-as-menu-item-text">
                    <span className="save-as-menu-item-label">
                      {option.label}
                    </span>
                    <span className="save-as-menu-item-hint">
                      {option.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
