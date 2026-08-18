import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import { c_megalo_game_statistic } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { encodeGameStatisticFormat } from "src/backend/compile/49/enums/e_megalo_game_statistic_format";
import { encodeGameStatisticGrouping } from "src/backend/compile/49/enums/e_megalo_game_statistic_grouping";
import { encodeGameStatisticSortOrder } from "src/backend/compile/49/enums/e_megalo_game_statistic_sort_order";
import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { IR } from "src/frontend/intermediate-representation";
import type { MegaloGameStatistic } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";

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
