import { useEffect, useRef } from "react";
import { dismissIfBackdropMouseDown } from "../lib/dismissIfBackdrop";
import { openExternalUrl } from "../lib/openExternalUrl";
import type { GithubReleaseInfo } from "../lib/updateCheck";
import { useT } from "../localization";

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
  const t = useT();
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
  const descriptionLines = t("update_description", {
    version: availableVersion,
    current: currentBuildString,
  }).split("\n");

  return (
    <div
      className="update-backdrop"
      onMouseDown={(event) => dismissIfBackdropMouseDown(event, onDismiss)}
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
          {t("update_title")}
        </h2>
        <p className="update-description" id="update-description">
          {descriptionLines.map((line, index) => (
            <span key={index}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>

        <div className="update-actions">
          <button className="update-skip" onClick={onSkip} type="button">
            {t("update_skip")}
          </button>
          <button
            className="update-download"
            onClick={() => {
              void openExternalUrl(release.htmlUrl);
            }}
            ref={downloadButtonRef}
            type="button"
          >
            {t("update_download")}
          </button>
        </div>
      </div>
    </div>
  );
}
