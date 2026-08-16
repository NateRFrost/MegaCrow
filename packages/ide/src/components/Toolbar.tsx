import { getCurrentWindow } from "@tauri-apps/api/window";
import { type MouseEvent, useEffect, useState } from "react";
import type { AppSettings } from "../lib/appSettings";
import { detectMccInstall, launchMcc } from "../lib/mccInstall";
import type { GametypeSaveFormat } from "../lib/megaloShim";
import { openDocs } from "../lib/openDocs";
import { isTauriRuntime } from "../lib/tauriRuntime";
import type { Workspace } from "../lib/workspace";
import { useT } from "../localization";
import { AboutDialog } from "./AboutDialog";
import { SaveAsMenu } from "./SaveAsMenu";
import { SettingsMenu } from "./SettingsMenu";
import { WindowControls } from "./WindowControls";

interface Props {
  canBuild: boolean;
  /** False for object lists and other non-compilable text. */
  canExport?: boolean;
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  fileName: string | null;
  onBuild: () => void;
  onCompile: (format: GametypeSaveFormat) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onSettingsChange: (patch: Partial<AppSettings>) => void;
  onShowMotd: () => void;
  onToggleSidebar: () => void;
  settings: AppSettings;
  sidebarOpen: boolean;
  workspace: Workspace | null;
}

export function Toolbar({
  workspace,
  onBuild,
  onCompile,
  canBuild,
  fileName,
  settings,
  onSettingsChange,
  onShowMotd,
  canExport = true,
  sidebarOpen,
  onToggleSidebar,
  canNavigateBack = false,
  canNavigateForward = false,
  onNavigateBack,
  onNavigateForward,
}: Props) {
  const t = useT();
  const frameless = isTauriRuntime();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mccInstalled, setMccInstalled] = useState(false);
  const [launchingMcc, setLaunchingMcc] = useState(false);

  const showMccLaunch =
    frameless && (workspace === null || workspace.megaloVersion === "107-mcc");

  useEffect(() => {
    if (!showMccLaunch) {
      setMccInstalled(false);
      return;
    }

    let cancelled = false;
    void detectMccInstall().then((info) => {
      if (!cancelled) {
        setMccInstalled(info.installed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showMccLaunch]);

  const handleLaunchMcc = async () => {
    if (!mccInstalled || launchingMcc) {
      return;
    }

    setLaunchingMcc(true);
    try {
      await launchMcc();
    } catch (error) {
      console.error("Failed to launch Halo MCC:", error);
    } finally {
      setLaunchingMcc(false);
    }
  };

  const handleTitlebarDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (!frameless) {
      return;
    }
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "button, select, a, .window-controls, .toolbar-menu, .settings-menu, .save-as-menu, .about-backdrop, .settings-modal-backdrop"
      )
    ) {
      return;
    }
    void getCurrentWindow().toggleMaximize();
  };

  return (
    <>
      <header
        className={`toolbar${frameless ? " toolbar--frameless" : ""}`}
        data-tauri-drag-region={frameless ? true : undefined}
        onDoubleClick={handleTitlebarDoubleClick}
      >
        <div className="toolbar-leading">
          <button
            className="brand"
            onClick={() => setAboutOpen(true)}
            title={t("toolbar_about")}
            type="button"
          >
            <img
              alt=""
              className="brand-icon"
              src={`${import.meta.env.BASE_URL}megacrow-icon.png`}
            />
            <span className="brand-text">
              <span className="brand-title">MegaCrow</span>
              <span className="brand-subtitle">Megalo IDE</span>
            </span>
          </button>

          <div aria-hidden="true" className="toolbar-divider" />

          <button
            aria-label={
              sidebarOpen
                ? t("toolbar_hide_left_pane")
                : t("toolbar_show_left_pane")
            }
            aria-pressed={sidebarOpen}
            className="toolbar-menu"
            onClick={onToggleSidebar}
            title={
              sidebarOpen
                ? t("toolbar_hide_left_pane")
                : t("toolbar_show_left_pane")
            }
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <rect
                fill="none"
                height="11.5"
                rx="1.25"
                stroke="currentColor"
                strokeWidth="1.25"
                width="12.5"
                x="1.75"
                y="2.25"
              />
              <path d="M6 2.25v11.5" stroke="currentColor" strokeWidth="1.25" />
              <rect
                fill="currentColor"
                height="10"
                opacity={sidebarOpen ? 0.85 : 0.35}
                width="3"
                x="2.5"
                y="3"
              />
            </svg>
          </button>

          <div
            aria-label={t("toolbar_file_history")}
            className="toolbar-nav"
            role="group"
          >
            <button
              aria-label={t("toolbar_back")}
              className="toolbar-menu"
              disabled={!canNavigateBack}
              onClick={onNavigateBack}
              title={t("toolbar_back")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path
                  d="M9.75 3.25 5 8l4.75 4.75"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.35"
                />
              </svg>
            </button>
            <button
              aria-label={t("toolbar_forward")}
              className="toolbar-menu"
              disabled={!canNavigateForward}
              onClick={onNavigateForward}
              title={t("toolbar_forward")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path
                  d="M6.25 3.25 11 8l-4.75 4.75"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.35"
                />
              </svg>
            </button>
          </div>

          <nav
            aria-label={t("toolbar_editor_actions")}
            className="toolbar-actions"
          >
            {showMccLaunch ? (
              <button
                className="toolbar-btn toolbar-btn--launch"
                disabled={!mccInstalled || launchingMcc}
                onClick={() => void handleLaunchMcc()}
                title={
                  mccInstalled
                    ? t("toolbar_launch_halo_title")
                    : t("toolbar_launch_halo_missing")
                }
                type="button"
              >
                {launchingMcc
                  ? t("toolbar_launching")
                  : t("toolbar_launch_halo")}
              </button>
            ) : null}

            <button
              className="toolbar-btn toolbar-btn--primary"
              disabled={!canBuild}
              onClick={onBuild}
              title={
                canBuild
                  ? t("toolbar_build_title")
                  : workspace?.outputPath?.trim()
                    ? t("toolbar_build_need_script")
                    : t("toolbar_build_need_output")
              }
              type="button"
            >
              {t("toolbar_build")}
            </button>
            <SaveAsMenu
              disabled={!(fileName && canExport)}
              onSave={onCompile}
            />
          </nav>
        </div>

        <div
          className="toolbar-center"
          title={
            workspace?.name && fileName
              ? `${workspace.name} | ${fileName}`
              : (workspace?.name ?? fileName ?? undefined)
          }
        >
          {workspace?.name ? (
            <span className="toolbar-center-workspace">{workspace.name}</span>
          ) : null}
          {workspace?.name && fileName ? (
            <span aria-hidden="true" className="toolbar-center-sep">
              |
            </span>
          ) : null}
          {fileName ? (
            <span className="toolbar-center-file">{fileName}</span>
          ) : null}
        </div>

        <div className="toolbar-trailing">
          <button
            aria-label={t("toolbar_docs_title")}
            className="toolbar-menu toolbar-menu--label"
            onClick={() => {
              void openDocs().catch((error) => {
                console.error("Failed to open docs:", error);
              });
            }}
            title={t("toolbar_docs_title")}
            type="button"
          >
            {t("toolbar_docs")}
          </button>
          <SettingsMenu onChange={onSettingsChange} settings={settings} />
          <WindowControls />
        </div>
      </header>

      <AboutDialog
        onClose={() => setAboutOpen(false)}
        onVersionClick={onShowMotd}
        open={aboutOpen}
      />
    </>
  );
}
