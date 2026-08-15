import { useEffect, useRef } from "react";
import type { VariantLimitItem, VariantLimitUsage } from "../lib/megaloShim";
import {
  formatVariantBytes,
  variantCapacityLevel,
} from "../lib/variantCapacity";

const SECTION_LABELS: Record<VariantLimitItem["section"], string> = {
  storage: "Storage",
  script: "Script",
  strings: "Strings",
  declarations: "Declarations",
};

const SECTION_ORDER: VariantLimitItem["section"][] = [
  "storage",
  "script",
  "strings",
  "declarations",
];

function formatLimitValue(item: VariantLimitItem): string {
  if (item.format === "bytes") {
    return `${formatVariantBytes(item.used)} / ${formatVariantBytes(item.max)}`;
  }
  return `${item.used.toLocaleString()} / ${item.max.toLocaleString()}`;
}

function LimitRow({ item }: { item: VariantLimitItem }) {
  const level = variantCapacityLevel(item.used, item.max);
  const fillPercent = Math.min(100, (item.used / item.max) * 100);

  return (
    <div className={`variant-limit-row variant-limit-row--${level}`}>
      <div className="variant-limit-row-head">
        <span className="variant-limit-row-label">{item.label}</span>
        <span className="variant-limit-row-value">
          {formatLimitValue(item)}
        </span>
      </div>
      <div aria-hidden className="variant-limit-row-track">
        <div
          className="variant-limit-row-fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  capacityBytes: number;
  onClose: () => void;
  open: boolean;
  usage: VariantLimitUsage | null;
  usedBytes: number;
}

export function VariantLimitsDialog({
  open,
  onClose,
  usage,
  usedBytes,
  capacityBytes,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const items = usage?.items ?? [
    {
      id: "storage",
      label: "Variant storage",
      used: usedBytes,
      max: capacityBytes,
      section: "storage" as const,
      format: "bytes" as const,
    },
  ];

  const grouped = SECTION_ORDER.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: items.filter((item) => item.section === section),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      className="variant-limits-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby="variant-limits-description"
        aria-labelledby="variant-limits-title"
        aria-modal="true"
        className="variant-limits-dialog"
        role="dialog"
      >
        <h2 className="variant-limits-title" id="variant-limits-title">
          Variant limits
        </h2>
        <p className="variant-limits-intro" id="variant-limits-description">
          Compile-time resource usage for this gametype script.
        </p>

        <div className="variant-limits-body">
          {grouped.map((group) => (
            <section className="variant-limits-section" key={group.section}>
              <h3 className="variant-limits-section-title">{group.label}</h3>
              {group.items.map((item) => (
                <LimitRow item={item} key={item.id} />
              ))}
            </section>
          ))}
        </div>

        <div className="variant-limits-actions">
          <button
            className="variant-limits-close"
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
