import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import type { Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";

/** Pre-release encodings have no map-permissions block. */
export const compileMapPermissions = (
  _ir: IR,
  _gameVariant: c_game_engine_custom_variant,
  _diagnostics: Diagnostics
): void => {
  // No map-permissions block on this encoding.
};
