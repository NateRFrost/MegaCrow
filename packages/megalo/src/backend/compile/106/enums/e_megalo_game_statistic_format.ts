import { e_megalo_game_statistic_format } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  GameStatisticFormat,
  type GameStatisticFormat as GameStatisticFormatName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const GAME_STATISTIC_FORMAT_TO_BLF = {
  [GameStatisticFormat.number]: e_megalo_game_statistic_format.number,
  [GameStatisticFormat.delta]: e_megalo_game_statistic_format.number_with_sign,
  [GameStatisticFormat.percentage]: e_megalo_game_statistic_format.percentage,
  [GameStatisticFormat.timer]: e_megalo_game_statistic_format.time,
} as const satisfies Record<
  GameStatisticFormatName,
  e_megalo_game_statistic_format
>;

export const encodeGameStatisticFormat = (
  value: GameStatisticFormatName
): e_megalo_game_statistic_format =>
  mapMegaloEnum(value, GAME_STATISTIC_FORMAT_TO_BLF);
