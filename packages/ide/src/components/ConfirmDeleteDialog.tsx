import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** File or folder name shown in the prompt. */
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  /** When true, wording mentions folder contents. */
  targetKind?: "file" | "directory";
}

export function ConfirmDeleteDialog({
  open,
  name,
  targetKind = "file",
  onCancel,
  onConfirm,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => confirmRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const title = targetKind === "directory" ? "Delete folder" : "Delete file";
  const body =
    targetKind === "directory"
      ? `Delete “${name}” and everything inside it? This cannot be undone.`
      : `Delete “${name}”? This cannot be undone.`;

  return createPortal(
    <div
      className="confirm-delete-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby="confirm-delete-description"
        aria-labelledby="confirm-delete-title"
        aria-modal="true"
        className="confirm-delete-dialog"
        role="dialog"
      >
        <h2 className="confirm-delete-title" id="confirm-delete-title">
          {title}
        </h2>
        <p className="confirm-delete-body" id="confirm-delete-description">
          {body}
        </p>
        <div className="confirm-delete-footer">
          <button
            className="confirm-delete-secondary"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="confirm-delete-danger"
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
