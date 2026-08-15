// Toggles for things MegaCrow adds that are not in MegaloEdit.
export interface MegacrowExtensions {
  /**
   * When a `base "….mglo"` cannot be read, compile a sibling `.txt` just-in-time
   * instead of failing. MegaloEdit always requires the compiled `.mglo`.
   */
  compileMissingBaseFromSource: boolean;
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
  compileMissingBaseFromSource: false,
};

/** IDE / LSP: enable every MegaCrow extension. */
export const ALL_MEGACROW_EXTENSIONS: MegacrowExtensions = {
  targetTeam: true,
  coopSpawningWaypointIcon: true,
  notBuiltIn: true,
  compileMissingBaseFromSource: true,
};

export const resolveMegacrowExtensions = (
  partial?: Partial<MegacrowExtensions>
): MegacrowExtensions => ({
  ...DEFAULT_MEGACROW_EXTENSIONS,
  ...partial,
});
