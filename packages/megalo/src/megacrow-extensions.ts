// Toggles for things MegaCrow adds that are not in MegaloEdit.
export interface MegacrowExtensions {
  // Solve Megalo Headache #3
  coopSpawningWaypointIcon: boolean;
  // Built-in gametypes are not labelled built-in.
  notBuiltIn: boolean;
  // Solve Megalo Headache #2
  targetTeam: boolean;
}

export const DEFAULT_MEGACROW_EXTENSIONS: MegacrowExtensions = {
  targetTeam: false,
  coopSpawningWaypointIcon: false,
  notBuiltIn: false,
};

export const resolveMegacrowExtensions = (
  partial?: Partial<MegacrowExtensions>
): MegacrowExtensions => ({
  ...DEFAULT_MEGACROW_EXTENSIONS,
  ...partial,
});
