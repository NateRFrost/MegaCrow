/** MegaloEdit `LoadoutPaletteType` — same integers as the action wire field. */
export const enum LoadoutPaletteType {
  none = 0,
  spartan_tier1 = 1,
  elite_tier1 = 2,
  spartan_tier2 = 3,
  elite_tier2 = 4,
  spartan_tier3 = 5,
  elite_tier3 = 6,
}

export const LOADOUT_PALETTE_TYPE_BY_NAME: Readonly<
  Record<string, LoadoutPaletteType>
> = {
  none: LoadoutPaletteType.none,
  spartan_tier1: LoadoutPaletteType.spartan_tier1,
  elite_tier1: LoadoutPaletteType.elite_tier1,
  spartan_tier2: LoadoutPaletteType.spartan_tier2,
  elite_tier2: LoadoutPaletteType.elite_tier2,
  spartan_tier3: LoadoutPaletteType.spartan_tier3,
  elite_tier3: LoadoutPaletteType.elite_tier3,
};
