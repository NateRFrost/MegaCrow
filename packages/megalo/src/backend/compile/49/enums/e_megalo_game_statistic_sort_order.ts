import { e_megalo_game_statistic_sort_order } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { GameStatisticSortOrder } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";

export const encodeGameStatisticSortOrder = (
  value: GameStatisticSortOrder
): e_megalo_game_statistic_sort_order => {
  switch (value) {
    case GameStatisticSortOrder.None:
      return e_megalo_game_statistic_sort_order.none;
    case GameStatisticSortOrder.Ascending:
      return e_megalo_game_statistic_sort_order.ascending;
    case GameStatisticSortOrder.Descending:
      return e_megalo_game_statistic_sort_order.descending;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
