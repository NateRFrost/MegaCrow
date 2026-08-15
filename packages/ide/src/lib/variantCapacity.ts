import type { MegaloVersionProfileId } from "./gametypeMetadata";

/** Reach MCC / TU1 gametype storage slot size (bytes). */
export const VARIANT_STORAGE_CAPACITY = 0x5000;

export const VARIANT_CAPACITY_BY_MEGALO_VERSION: Record<
  MegaloVersionProfileId,
  number
> = {
  "107-mcc": VARIANT_STORAGE_CAPACITY,
  "107": VARIANT_STORAGE_CAPACITY,
};

export function formatVariantBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export type VariantCapacityLevel = "ok" | "warn" | "danger";

export function variantCapacityLevel(
  usedBytes: number,
  capacityBytes: number
): VariantCapacityLevel {
  if (usedBytes > capacityBytes) {
    return "danger";
  }
  const ratio = usedBytes / capacityBytes;
  if (ratio >= 0.95) {
    return "danger";
  }
  if (ratio >= 0.8) {
    return "warn";
  }
  return "ok";
}
