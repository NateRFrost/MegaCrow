import { type MouseEvent, useEffect, useRef } from "react";
import blfPackageJson from "../../../../node_modules/@blamnetwork/blf/package.json";
import { MEGACROW_BUILD_STRING } from "../lib/megaloShim";
import { openExternalUrl } from "../lib/openExternalUrl";

interface Props {
  onClose: () => void;
  onVersionClick?: () => void;
  open: boolean;
}

export function AboutDialog({ open, onClose, onVersionClick }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleExternalLink = (
    event: MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    void openExternalUrl(url);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="about-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby="about-description"
        aria-labelledby="about-title"
        aria-modal="true"
        className="about-dialog"
        role="dialog"
      >
        <div className="about-header">
          <img
            alt=""
            className="about-icon"
            height={64}
            src={`${import.meta.env.BASE_URL}megacrow-icon.png`}
            width={64}
          />
          <h2 className="about-name" id="about-title">
            MegaCrow
          </h2>
          <button
            className="about-version"
            onClick={() => onVersionClick?.()}
            type="button"
          >
            {MEGACROW_BUILD_STRING}
          </button>
        </div>

        <p className="about-tagline" id="about-description">
          Megalo script IDE for Halo Reach gametypes — edit and compile Reach
          variant scripts.
        </p>

        <dl className="about-details">
          <div className="about-detail">
            <dt>@blamnetwork/blf</dt>
            <dd>{blfPackageJson.version}</dd>
          </div>
          <div className="about-detail">
            <dt>Publisher</dt>
            <dd>
              <a
                className="about-link"
                href="https://blam.network"
                onClick={(event) =>
                  handleExternalLink(event, "https://blam.network")
                }
                rel="noopener noreferrer"
                target="_blank"
              >
                blam.network
              </a>
            </dd>
          </div>
        </dl>

        <p className="about-credit">
          Made with &lt;3 by{" "}
          <a
            className="about-link"
            href="https://github.com/craftycodie"
            onClick={(event) =>
              handleExternalLink(event, "https://github.com/craftycodie")
            }
            rel="noopener noreferrer"
            target="_blank"
          >
            @craftycodie
          </a>
        </p>

        <div className="about-actions">
          <button
            className="about-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
