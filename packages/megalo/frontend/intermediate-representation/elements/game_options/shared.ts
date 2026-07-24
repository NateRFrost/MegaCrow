import type { PlayerTraits } from "../../game/game_engine_player_traits";
import type { ValueWithLocation } from "../..";

export const emptyPlayerTraits = (): PlayerTraits => ({
  shieldVitality: {},
  weapons: {},
  movement: {},
  appearance: {},
  sensors: {},
});

export const unwrapNumber = (value: ValueWithLocation<number>): number =>
  value.value;
