import { e_megalo_game_statistic_grouping } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  GameStatisticGrouping,
  type GameStatisticGrouping as GameStatisticGroupingName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const GAME_STATISTIC_GROUPING_TO_BLF = {
  [GameStatisticGrouping.none]: e_megalo_game_statistic_grouping.player,
  [GameStatisticGrouping.team]: e_megalo_game_statistic_grouping.team,
} as const satisfies Record<
  GameStatisticGroupingName,
  e_megalo_game_statistic_grouping
>;

export const encodeGameStatisticGrouping = (
  value: GameStatisticGroupingName
): e_megalo_game_statistic_grouping =>
  mapMegaloEnum(value, GAME_STATISTIC_GROUPING_TO_BLF);
