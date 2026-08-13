import { SyntaxKind } from "../../abstract-syntax-tree";
import type { GameStatsElementNode } from "../../abstract-syntax-tree/elements/game_stats";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { ElementLowerer } from ".";
import { dxAssertionScope } from "../diagnostics";
import { assertNotErrorNode } from "../diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import {
  GameStatisticFormat,
  GameStatisticGrouping,
  GameStatisticSortOrder,
  type MegaloGameStatistic,
} from "../game/megalogamengine/megalogamengine_statistics";
import { resolveScriptStringTableReference } from "../parameters/resolveScriptStringTableReference";

const GAME_STATISTIC_FORMATS: Record<string, GameStatisticFormat> = {
  number: GameStatisticFormat.Number,
  delta: GameStatisticFormat.NumberWithSign,
  percentage: GameStatisticFormat.Percentage,
  timer: GameStatisticFormat.Time,
};

const GAME_STATISTIC_FORMAT_NAMES = Object.keys(GAME_STATISTIC_FORMATS);

const GAME_STATISTIC_GROUPINGS: Record<string, GameStatisticGrouping> = {
  none: GameStatisticGrouping.Player,
  team: GameStatisticGrouping.Team,
};

const GAME_STATISTIC_GROUPING_NAMES = Object.keys(GAME_STATISTIC_GROUPINGS);

const GAME_STATISTIC_SORT_ORDERS: Record<number, GameStatisticSortOrder> = {
  [-1]: GameStatisticSortOrder.None,
  [0]: GameStatisticSortOrder.Ascending,
  [1]: GameStatisticSortOrder.Descending,
};

export const gameStatsLowerer: ElementLowerer<GameStatsElementNode> = (
  element,
  ctx
) => {
  const statistics = ctx.ir.gameVariant.gameEngine.statistics;

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      assertNotErrorNode(entry.name);
      assertNotErrorNode(entry.type);
      if (entry.grouping.kind === SyntaxKind.INVALID) {
        return;
      }
      if (entry.sort.kind === SyntaxKind.INVALID) {
        return;
      }
      assertSyntaxKind(entry.grouping, SyntaxKind.KEYWORD);
      assertSyntaxKind(entry.sort, SyntaxKind.INTEGER);

      const format = GAME_STATISTIC_FORMATS[entry.type.value];
      if (format === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            GAME_STATISTIC_FORMAT_NAMES.map((name) => `'${name}'`),
            entry.type.value
          ),
          entry.type.location
        );
      }

      const grouping = GAME_STATISTIC_GROUPINGS[entry.grouping.value];
      if (grouping === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            GAME_STATISTIC_GROUPING_NAMES.map((name) => `'${name}'`),
            entry.grouping.value
          ),
          entry.grouping.location
        );
      }

      const sortOrder = GAME_STATISTIC_SORT_ORDERS[entry.sort.value];
      if (sortOrder === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            ["'-1'", "'0'", "'1'"],
            String(entry.sort.value)
          ),
          entry.sort.location
        );
      }

      const nameStringIndex = resolveScriptStringTableReference(
        entry.labelString,
        ctx.ir,
        ctx.symbolTable
      );

      const statistic: MegaloGameStatistic = {
        nameStringIndex,
        format,
        sortOrder,
        grouping,
      };
      statistics.push(statistic);
    });
  }
};
