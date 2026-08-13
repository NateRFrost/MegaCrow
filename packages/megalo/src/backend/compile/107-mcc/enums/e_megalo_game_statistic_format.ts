import { e_megalo_game_statistic_format } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { GameStatisticFormat } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";

export const encodeGameStatisticFormat = (
  value: GameStatisticFormat
): e_megalo_game_statistic_format => {
  switch (value) {
    case GameStatisticFormat.Number:
      return e_megalo_game_statistic_format.number;
    case GameStatisticFormat.NumberWithSign:
      return e_megalo_game_statistic_format.number_with_sign;
    case GameStatisticFormat.Percentage:
      return e_megalo_game_statistic_format.percentage;
    case GameStatisticFormat.Time:
      return e_megalo_game_statistic_format.time;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
