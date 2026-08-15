import { useState } from "react";
import type { VariantLimitUsage } from "../lib/megaloShim";
import {
  formatVariantBytes,
  variantCapacityLevel,
} from "../lib/variantCapacity";
import { VariantLimitsDialog } from "./VariantLimitsDialog";

interface Props {
  capacityBytes: number;
  limitUsage: VariantLimitUsage | null;
  usedBytes: number | null;
}

export function VariantCapacityMeter({
  usedBytes,
  capacityBytes,
  limitUsage,
}: Props) {
  const [open, setOpen] = useState(false);

  if (usedBytes === null) {
    return null;
  }

  const level = variantCapacityLevel(usedBytes, capacityBytes);
  const percent = Math.round((usedBytes / capacityBytes) * 100);
  const fillPercent = Math.min(100, (usedBytes / capacityBytes) * 100);
  const over = usedBytes > capacityBytes;

  return (
    <>
      <button
        aria-label={`Variant storage ${percent} percent full. Show limits breakdown.`}
        className={`variant-capacity variant-capacity--${level}`}
        onClick={() => setOpen(true)}
        title="Show variant limits"
        type="button"
      >
        <div aria-hidden className="variant-capacity-track">
          <div
            className="variant-capacity-fill"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <span className="variant-capacity-label">
          {formatVariantBytes(usedBytes)} / {formatVariantBytes(capacityBytes)}
          {over ? " +" : ""}
        </span>
      </button>
      <VariantLimitsDialog
        capacityBytes={capacityBytes}
        onClose={() => setOpen(false)}
        open={open}
        usage={limitUsage}
        usedBytes={usedBytes}
      />
    </>
  );
}
