import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";

/** MegaloEdit `LoadoutPaletteType` names — wire indexes assigned at compile. */
export const loadoutPaletteType = megaloEnum([
  "none",
  "spartan_tier1",
  "elite_tier1",
  "spartan_tier2",
  "elite_tier2",
  "spartan_tier3",
  "elite_tier3",
] as const);

export const LoadoutPaletteType = loadoutPaletteType.enum;
export type LoadoutPaletteType = MegaloEnumNames<typeof loadoutPaletteType>;
