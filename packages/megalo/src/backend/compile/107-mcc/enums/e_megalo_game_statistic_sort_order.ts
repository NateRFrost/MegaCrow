import { e_megalo_game_statistic_sort_order } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { GameStatisticSortOrder } from "../../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";

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
