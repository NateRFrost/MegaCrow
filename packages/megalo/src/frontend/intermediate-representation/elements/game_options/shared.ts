import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";

export const emptyPlayerTraits = (): PlayerTraits => ({
  shieldVitality: {},
  weapons: {},
  movement: {},
  appearance: {},
  sensors: {},
});
