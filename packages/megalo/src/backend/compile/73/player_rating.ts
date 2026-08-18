import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v09730_10_04_09_1309_omaha_delta";
import type { IR } from "src/frontend/intermediate-representation";

/** Pre-release encodings have no player-ratings block. */
export const compilePlayerRatings = (
  _ir: IR,
  _gameVariant: c_game_engine_custom_variant
): void => {
  // No player-ratings block on this encoding.
};
