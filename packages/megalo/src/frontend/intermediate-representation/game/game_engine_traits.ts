import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";

export type PlayerTraitOption = {
  name: StringTableReference;
  description: StringTableReference;
  traits: PlayerTraits;
};
