// Toggles for things MegaCrow adds that are not in MegaloEdit.
export interface MegacrowExtensions {
  /**
   * When a `base "….mglo"` cannot be read, compile a sibling `.txt` just-in-time
   * instead of failing. MegaloEdit always requires the compiled `.mglo`.
   */
  compileMissingBaseFromSource: boolean;
  // Solve Megalo Headache #3
  coopSpawningWaypointIcon: boolean;
  /**
   * Seed undocumented builtin string `megacrow_version` with the MegaCrow build string.
   */
  megacrowVersionString: boolean;
  // Built-in gametypes are not labelled built-in.
  notBuiltIn: boolean;
  /**
   * Accept legacy syntax MegaloEdit rejects (e.g. `text` prefix on hud_widgets)
   * as a warning instead of an error on version 106+.
   */
  supportLegacySyntax: boolean;
  // Solve Megalo Headache #2
  targetTeam: boolean;
}

export const DEFAULT_MEGACROW_EXTENSIONS: MegacrowExtensions = {
  targetTeam: false,
  coopSpawningWaypointIcon: false,
  notBuiltIn: false,
  compileMissingBaseFromSource: false,
  megacrowVersionString: false,
  supportLegacySyntax: false,
};

/** IDE / LSP: enable every MegaCrow extension. */
export const ALL_MEGACROW_EXTENSIONS: MegacrowExtensions = {
  targetTeam: true,
  coopSpawningWaypointIcon: true,
  notBuiltIn: true,
  compileMissingBaseFromSource: true,
  megacrowVersionString: true,
  supportLegacySyntax: true,
};

export const resolveMegacrowExtensions = (
  partial?: Partial<MegacrowExtensions>
): MegacrowExtensions => ({
  ...DEFAULT_MEGACROW_EXTENSIONS,
  ...partial,
});
