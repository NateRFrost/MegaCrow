import { useEffect, useRef } from "react";
import { openExternalUrl } from "../lib/openExternalUrl";
import type { GithubReleaseInfo } from "../lib/updateCheck";

interface Props {
  currentBuildString: string;
  onDismiss: () => void;
  onSkip: () => void;
  open: boolean;
  release: GithubReleaseInfo | null;
}

export function UpdateAvailableDialog({
  currentBuildString,
  open,
  release,
  onDismiss,
  onSkip,
}: Props) {
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    downloadButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!(open && release)) {
    return null;
  }

  const availableVersion = release.tagName;

  return (
    <div
      className="update-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby="update-description"
        aria-labelledby="update-title"
        aria-modal="true"
        className="update-dialog"
        role="dialog"
      >
        <h2 className="update-title" id="update-title">
          Update Available
        </h2>
        <p className="update-description" id="update-description">
          MegaCrow {availableVersion} is available.
          <br />
          You are on {currentBuildString}.
        </p>

        <div className="update-actions">
          <button className="update-skip" onClick={onSkip} type="button">
            Skip this update
          </button>
          <button
            className="update-download"
            onClick={() => {
              void openExternalUrl(release.htmlUrl);
            }}
            ref={downloadButtonRef}
            type="button"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
