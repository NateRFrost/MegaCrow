import { useEffect, useRef, useState } from "react";
import type { AppSettings } from "../lib/appSettings";
import { EDITOR_THEME_OPTIONS } from "../monaco/theme";

interface Props {
  onChange: (patch: Partial<AppSettings>) => void;
  settings: AppSettings;
}

export function SettingsMenu({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="settings-menu">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Settings"
        className="toolbar-menu toolbar-menu--label"
        onClick={() => setOpen(true)}
        title="Settings"
        type="button"
      >
        Settings
      </button>

      {open ? (
        <div
          className="settings-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            aria-labelledby="settings-modal-title"
            aria-modal="true"
            className="settings-modal"
            role="dialog"
          >
            <h2 className="settings-modal-title" id="settings-modal-title">
              Settings
            </h2>

            <div className="settings-modal-body">
              <label className="settings-field">
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">Language</span>
                  <span className="settings-toggle-hint">
                    Language for diagnostics and hover help
                  </span>
                </span>
                <select
                  className="settings-select"
                  onChange={(event) =>
                    onChange({
                      locale: event.target.value === "ja" ? "ja" : "en",
                    })
                  }
                  value={settings.locale}
                >
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </label>

              <label className="settings-field">
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">Editor theme</span>
                  <span className="settings-toggle-hint">
                    Color theme for the Megalo editor
                  </span>
                </span>
                <select
                  className="settings-select"
                  onChange={(event) =>
                    onChange({ editorTheme: event.target.value })
                  }
                  value={settings.editorTheme}
                >
                  {EDITOR_THEME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.discordRichPresence}
                  onChange={(event) =>
                    onChange({ discordRichPresence: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">
                    Discord rich presence
                  </span>
                  <span className="settings-toggle-hint">
                    Show what you are editing in Discord
                  </span>
                </span>
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.mccHotReload}
                  onChange={(event) =>
                    onChange({ mccHotReload: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">MCC hot reload</span>
                  <span className="settings-toggle-hint">
                    Write compiled .mglo to the MCC HotReload folder when
                    compiling
                  </span>
                </span>
              </label>

              <label className="settings-field">
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">Gamertag</span>
                  <span className="settings-toggle-hint">
                    Creator gamertag written into the gametype, 16 characters
                    maximum
                  </span>
                </span>
                <input
                  className="settings-input"
                  maxLength={16}
                  onChange={(event) =>
                    onChange({ gamertag: event.target.value })
                  }
                  spellCheck={false}
                  type="text"
                  value={settings.gamertag}
                />
              </label>

              <label className="settings-toggle">
                <input
                  checked={settings.compilerStrictness}
                  onChange={(event) =>
                    onChange({ compilerStrictness: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="settings-toggle-text">
                  <span className="settings-toggle-label">
                    Compiler strictness
                  </span>
                  <span className="settings-toggle-hint">
                    Enforce localization — quoted string literals become errors
                  </span>
                </span>
              </label>
            </div>

            <div className="settings-modal-footer">
              <button
                className="settings-modal-close"
                onClick={() => setOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
