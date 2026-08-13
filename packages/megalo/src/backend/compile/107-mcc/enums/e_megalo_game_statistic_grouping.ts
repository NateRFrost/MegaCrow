import { e_megalo_game_statistic_grouping } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { GameStatisticGrouping } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";

export const encodeGameStatisticGrouping = (
  value: GameStatisticGrouping
): e_megalo_game_statistic_grouping => {
  switch (value) {
    case GameStatisticGrouping.Player:
      return e_megalo_game_statistic_grouping.player;
    case GameStatisticGrouping.Team:
      return e_megalo_game_statistic_grouping.team;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
