import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { GameStatsElementNode } from "src/frontend/abstract-syntax-tree/elements/game_stats";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  GameStatisticSortOrder,
  gameStatisticFormat,
  gameStatisticGrouping,
  type MegaloGameStatistic,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { resolveScriptStringTableReference } from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";

const GAME_STATISTIC_SORT_ORDERS = new Set<number>([
  GameStatisticSortOrder.None,
  GameStatisticSortOrder.Ascending,
  GameStatisticSortOrder.Descending,
]);

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

      const format = gameStatisticFormat.parse(entry.type.value);
      if (format === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            gameStatisticFormat.names.map((name) => `'${name}'`),
            entry.type.value
          ),
          entry.type.location
        );
      }

      const grouping = gameStatisticGrouping.parse(entry.grouping.value);
      if (grouping === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            gameStatisticGrouping.names.map((name) => `'${name}'`),
            entry.grouping.value
          ),
          entry.grouping.location
        );
      }

      if (!GAME_STATISTIC_SORT_ORDERS.has(entry.sort.value)) {
        throw new LowerError(
          diagnosticMessages.expectedOneOf(
            ["'-1'", "'0'", "'1'"],
            String(entry.sort.value)
          ),
          entry.sort.location
        );
      }
      const sortOrder = entry.sort.value as GameStatisticSortOrder;

      const nameStringIndex = resolveScriptStringTableReference(
        entry.labelString,
        ctx.ir,
        ctx
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
