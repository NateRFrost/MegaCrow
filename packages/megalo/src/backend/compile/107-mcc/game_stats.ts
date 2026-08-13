import {
  type c_game_engine_custom_variant,
  c_megalo_game_statistic,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { BUILT_IN_LOCATION, type Diagnostics } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { IR } from "../../../frontend/intermediate-representation";
import type { MegaloGameStatistic } from "../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { encodeGameStatisticFormat } from "./enums/e_megalo_game_statistic_format";
import { encodeGameStatisticGrouping } from "./enums/e_megalo_game_statistic_grouping";
import { encodeGameStatisticSortOrder } from "./enums/e_megalo_game_statistic_sort_order";

const MAX_GAME_STATISTICS = 4;

const compileGameStatistic = (
  statistic: MegaloGameStatistic
): c_megalo_game_statistic => {
  const target = new c_megalo_game_statistic();
  target.m_name_string_index = statistic.nameStringIndex;
  target.m_format = encodeGameStatisticFormat(statistic.format);
  target.m_sort_order = encodeGameStatisticSortOrder(statistic.sortOrder);
  target.m_grouping = encodeGameStatisticGrouping(statistic.grouping);
  return target;
};

export const compileGameStats = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  const statistics = ir.gameVariant.gameEngine.statistics;

  if (statistics.length > MAX_GAME_STATISTICS) {
    diagnostics.addError(
      diagnosticMessages.tooManyGameStatistics(),
      BUILT_IN_LOCATION
    );
  }

  gameVariant.m_game_engine.m_statistics = statistics
    .slice(0, MAX_GAME_STATISTICS)
    .map(compileGameStatistic);
};
