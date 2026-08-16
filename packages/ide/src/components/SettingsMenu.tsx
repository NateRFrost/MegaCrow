import { useEffect, useRef, useState } from "react";
import type { AppSettings, CompilerProfile } from "../lib/appSettings";
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
              <section
                aria-labelledby="settings-compiler-heading"
                className="settings-section"
              >
                <h3
                  className="settings-section-title"
                  id="settings-compiler-heading"
                >
                  Compiler Settings
                </h3>

                <label className="settings-field">
                  <span className="settings-toggle-text">
                    <span className="settings-toggle-label">
                      Gametype Author
                    </span>
                    <span className="settings-toggle-hint">
                      Creator written into the gametype, 16 characters maximum
                    </span>
                  </span>
                  <input
                    className="settings-input"
                    maxLength={16}
                    onChange={(event) =>
                      onChange({ gamertag: event.target.value })
                    }
                    placeholder="(empty)"
                    spellCheck={false}
                    type="text"
                    value={settings.gamertag}
                  />
                </label>

                <label className="settings-field">
                  <span className="settings-toggle-text">
                    <span className="settings-toggle-label">
                      Compiler profile
                    </span>
                    <span className="settings-toggle-hint">
                      MegaloEdit disables MegaCrow language extensions
                    </span>
                  </span>
                  <select
                    className="settings-select"
                    onChange={(event) =>
                      onChange({
                        compilerProfile: event.target.value as CompilerProfile,
                      })
                    }
                    value={settings.compilerProfile}
                  >
                    <option value="megacrow">MegaCrow</option>
                    <option value="megaloedit">MegaloEdit</option>
                  </select>
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
                      Enforce localization — quoted string literals become
                      errors
                    </span>
                  </span>
                </label>
              </section>

              <section
                aria-labelledby="settings-editor-heading"
                className="settings-section"
              >
                <h3
                  className="settings-section-title"
                  id="settings-editor-heading"
                >
                  Editor Settings
                </h3>

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
              </section>
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
