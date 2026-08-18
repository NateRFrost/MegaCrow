import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
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
