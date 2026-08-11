import type { PlayerTraits } from "../../game/game_engine_player_traits";

export const emptyPlayerTraits = (): PlayerTraits => ({
  shieldVitality: {},
  weapons: {},
  movement: {},
  appearance: {},
  sensors: {},
});
