import { exists } from "@tauri-apps/plugin-fs";
import { useEffect, useRef, useState } from "react";
import type { StoredWorkspace } from "../lib/megacrowSettings";
import { pickTauriFolder } from "../lib/tauriDisk";
import { guessOutputPathFromScripts } from "../lib/workspacePaths";

export interface WorkspaceDraft {
  inputPath: string;
  name: string;
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
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("HREK");
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initialWorkspace;

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(initialWorkspace?.name ?? "HREK");
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
      if (event.key === "Escape" && !required) {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, required, onCancel]);

  if (!open) {
    return null;
  }

  const pickScripts = async () => {
    const selected = await pickTauriFolder();
    if (!selected) {
      return;
    }
    setInputPath(selected);
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
    if (!trimmedName) {
      setError("Enter a workspace name.");
      return;
    }
    if (!inputPath.trim()) {
      setError("Choose a scripts folder.");
      return;
    }
    if (!outputPath.trim()) {
      setError("Choose an output folder.");
      return;
    }
    setBusy(true);
    setError(null);
    onSave({
      name: trimmedName,
      inputPath: inputPath.trim(),
      outputPath: outputPath.trim(),
    });
    setBusy(false);
  };

  return (
    <div
      className="workspace-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !required) {
          onCancel?.();
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
            {isEdit ? "Edit workspace" : "Add workspace"}
          </h2>
          {required ? null : (
            <button
              aria-label="Close"
              className="workspace-modal-close"
              onClick={() => onCancel?.()}
              title="Close"
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
          )}
        </div>
        <p className="workspace-modal-hint">
          Point MegaCrow at a Halo Reach Editing Kit scripts folder and the
          matching maps/megalo output folder.
        </p>

        <label className="workspace-modal-field">
          <span>Name</span>
          <input
            maxLength={64}
            onChange={(event) => setName(event.target.value)}
            ref={nameRef}
            type="text"
            value={name}
          />
        </label>

        <label className="workspace-modal-field">
          <span>Megalo version</span>
          <input disabled readOnly type="text" value="107 MCC (Halo Reach)" />
        </label>

        <div className="workspace-modal-field">
          <span>Scripts folder</span>
          <div className="workspace-modal-path-row">
            <input
              onChange={(event) => setInputPath(event.target.value)}
              placeholder="…\data\multiplayer\megalo"
              type="text"
              value={inputPath}
            />
            <button
              className="workspace-modal-browse"
              onClick={() => void pickScripts()}
              type="button"
            >
              Browse…
            </button>
          </div>
        </div>

        <div className="workspace-modal-field">
          <span>Output folder</span>
          <div className="workspace-modal-path-row">
            <input
              onChange={(event) => setOutputPath(event.target.value)}
              placeholder="…\maps\megalo"
              type="text"
              value={outputPath}
            />
            <button
              className="workspace-modal-browse"
              onClick={() => void pickOutput()}
              type="button"
            >
              Browse…
            </button>
          </div>
        </div>

        {error ? <p className="workspace-modal-error">{error}</p> : null}

        <div className="workspace-modal-footer">
          {required ? null : (
            <button
              className="workspace-modal-secondary"
              onClick={() => onCancel?.()}
              type="button"
            >
              Cancel
            </button>
          )}
          <button
            className="workspace-modal-primary"
            disabled={busy}
            onClick={handleSave}
            type="button"
          >
            {isEdit ? "Save workspace" : "Add workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}
