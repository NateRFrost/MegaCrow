import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";

export interface PlayerTraitOption {
  description: StringTableReference;
  name: StringTableReference;
  traits: PlayerTraits;
}
