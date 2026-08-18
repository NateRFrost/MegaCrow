/** Supported Megalo engine profiles (mirrors `@megacrow/megalo` MEGALO_VERSIONS). */
export const MEGALO_VERSION_OPTIONS = [
  {
    id: "107-mcc",
    label: "Halo: Reach - The Master Chief Collection",
    description: "107-mcc",
  },
  {
    id: "107",
    label: "Halo: Reach - Title Update 1",
    description: "107",
  },
  {
    id: "106",
    label: "Halo: Reach - Release",
    description: "106",
  },
  {
    id: "73",
    label: "Halo: Reach - Beta",
    description: "73",
  },
  {
    id: "49",
    label: "Halo: Reach - Alpha",
    description: "49",
  },
] as const;

export type MegaloVersionId = (typeof MEGALO_VERSION_OPTIONS)[number]["id"];

export const DEFAULT_MEGALO_VERSION: MegaloVersionId = "107-mcc";

export const isMegaloVersionId = (value: string): value is MegaloVersionId =>
  MEGALO_VERSION_OPTIONS.some((option) => option.id === value);

export const labelForMegaloVersion = (id: MegaloVersionId): string =>
  MEGALO_VERSION_OPTIONS.find((option) => option.id === id)?.label ?? id;
