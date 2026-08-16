import { join } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredWorkspace } from "../lib/megacrowSettings";
import { getLabel, MEGALO_VERSIONS } from "../lib/megaloShim";
import { pickTauriFolder } from "../lib/tauriDisk";
import {
  guessHrekRootFromScripts,
  guessOutputPathFromScripts,
  parseProjectXmlDisplayName,
} from "../lib/workspacePaths";
import { useT } from "../localization";

export interface WorkspaceDraft {
  inputPath: string;
  name: string;
  /** Empty string when the workspace has no build output folder. */
  outputPath: string;
}

interface Props {
  /** When set, modal edits this workspace instead of creating a new one. */
  initialWorkspace?: StoredWorkspace | null;
  onCancel?: () => void;
  onSave: (workspace: WorkspaceDraft) => void;
  open: boolean;
  required?: boolean;
}

export function AddWorkspaceModal({
  open,
  required = false,
  initialWorkspace = null,
  onCancel,
  onSave,
}: Props) {
  const t = useT();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initialWorkspace;

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(initialWorkspace?.name ?? "");
    setInputPath(initialWorkspace?.inputPath ?? "");
    setOutputPath(initialWorkspace?.outputPath ?? "");
    setError(null);
    setBusy(false);
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, initialWorkspace]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  const canSave = useMemo(
    () => name.trim().length > 0 && inputPath.trim().length > 0,
    [name, inputPath]
  );

  if (!open) {
    return null;
  }

  const dismiss = () => {
    onCancel?.();
  };

  const pickScripts = async () => {
    const selected = await pickTauriFolder();
    if (!selected) {
      return;
    }
    setInputPath(selected);

    // Only fill name from project.xml when the user hasn't typed one yet.
    if (!name.trim()) {
      const hrekRoot = guessHrekRootFromScripts(selected);
      if (hrekRoot) {
        try {
          const projectXmlPath = await join(hrekRoot, "project.xml");
          if (await exists(projectXmlPath)) {
            const displayName = parseProjectXmlDisplayName(
              await readTextFile(projectXmlPath)
            );
            if (displayName) {
              setName(displayName);
            }
          }
        } catch {
          // leave name empty if project.xml cannot be read
        }
      }
    }

    const guessed = guessOutputPathFromScripts(selected);
    if (!guessed) {
      return;
    }
    try {
      if (await exists(guessed)) {
        setOutputPath(guessed);
      }
    } catch {
      // leave output as-is if exists check fails
    }
  };

  const pickOutput = async () => {
    const selected = await pickTauriFolder();
    if (selected) {
      setOutputPath(selected);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedInput = inputPath.trim();
    if (!trimmedName) {
      setError(t("workspace_modal_error_name"));
      nameRef.current?.focus();
      return;
    }
    if (!trimmedInput) {
      setError(t("workspace_modal_error_scripts"));
      return;
    }
    setBusy(true);
    setError(null);
    onSave({
      name: trimmedName,
      inputPath: trimmedInput,
      outputPath: outputPath.trim(),
    });
    setBusy(false);
  };

  return (
    <div
      className="workspace-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby="workspace-modal-title"
        aria-modal="true"
        className="workspace-modal"
        role="dialog"
      >
        <div className="workspace-modal-header">
          <h2 className="workspace-modal-title" id="workspace-modal-title">
            {isEdit
              ? t("workspace_modal_edit_title")
              : t("workspace_modal_add_title")}
          </h2>
          <button
            aria-label={t("common_close")}
            className="workspace-modal-close"
            onClick={dismiss}
            title={t("common_close")}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path
                d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </div>
        <p className="workspace-modal-hint">
          {required
            ? t("workspace_modal_hint_required")
            : t("workspace_modal_hint")}
        </p>

        <div className="workspace-modal-field-row">
          <label className="workspace-modal-field">
            <span>
              {t("workspace_modal_name")}{" "}
              <span className="workspace-modal-required">*</span>
            </span>
            <input
              maxLength={64}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSave) {
                  event.preventDefault();
                  handleSave();
                }
              }}
              placeholder={t("workspace_modal_name_placeholder")}
              ref={nameRef}
              required
              type="text"
              value={name}
            />
          </label>

          <label className="workspace-modal-field">
            <span>{t("workspace_modal_megalo_version")}</span>
            <input
              disabled
              readOnly
              type="text"
              value={getLabel(MEGALO_VERSIONS["107-mcc"])}
            />
          </label>
        </div>

        <div className="workspace-modal-field">
          <span>
            {t("workspace_modal_scripts_folder")}{" "}
            <span className="workspace-modal-required">*</span>
          </span>
          <div className="workspace-modal-path-row">
            <input
              onChange={(event) => setInputPath(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSave) {
                  event.preventDefault();
                  handleSave();
                }
              }}
              placeholder={t("workspace_modal_scripts_placeholder")}
              required
              type="text"
              value={inputPath}
            />
            <button
              className="workspace-modal-browse"
              onClick={() => void pickScripts()}
              type="button"
            >
              {t("workspace_modal_browse")}
            </button>
          </div>
        </div>

        <div className="workspace-modal-field">
          <span>{t("workspace_modal_output_folder")}</span>
          <div className="workspace-modal-path-row">
            <input
              onChange={(event) => setOutputPath(event.target.value)}
              placeholder={t("workspace_modal_output_placeholder")}
              type="text"
              value={outputPath}
            />
            <button
              className="workspace-modal-browse"
              onClick={() => void pickOutput()}
              type="button"
            >
              {t("workspace_modal_browse")}
            </button>
          </div>
        </div>

        {error ? <p className="workspace-modal-error">{error}</p> : null}

        <div className="workspace-modal-footer">
          <button
            className="workspace-modal-secondary"
            onClick={dismiss}
            type="button"
          >
            {t("common_cancel")}
          </button>
          <button
            className="workspace-modal-primary"
            disabled={busy || !canSave}
            onClick={handleSave}
            type="button"
          >
            {isEdit
              ? t("workspace_modal_save_button")
              : t("workspace_modal_add_button")}
          </button>
        </div>
      </div>
    </div>
  );
}
