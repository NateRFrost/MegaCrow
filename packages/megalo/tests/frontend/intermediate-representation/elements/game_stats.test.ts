import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import {
  GameStatisticFormat,
  GameStatisticGrouping,
  GameStatisticSortOrder,
} from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { Lexer } from "../../../../src/frontend/tokens";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { MEGALO_VERSIONS } from "../../../../src/version";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(ast, diagnostics, { objectLists });
  return { ir, diagnostics };
};

describe("game_stats lowering", () => {
  it("lowers format, grouping, sort order, and name strings", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
\tstat_delta_text "Delta"
\tstat_pct_text "Percent"
\tstat_time_text "Time"
end
game_stats
\tstat_caps number stat_caps_text none 1
\tstat_delta delta "Delta" team 0
\tstat_pct percentage stat_pct_text none -1
\tstat_time timer stat_time_text team 1
end
`;
    const { ir, diagnostics } = lower(source);
    const statistics = ir.gameVariant.gameEngine.statistics;

    expect(diagnostics.getErrors()).toEqual([]);
    expect(statistics).toHaveLength(4);
    expect(statistics[0]).toMatchObject({
      nameStringIndex: expect.any(Number),
      format: GameStatisticFormat.number,
      grouping: GameStatisticGrouping.none,
      sortOrder: GameStatisticSortOrder.Descending,
    });
    expect(statistics[1]).toMatchObject({
      format: GameStatisticFormat.delta,
      grouping: GameStatisticGrouping.team,
      sortOrder: GameStatisticSortOrder.Ascending,
    });
    expect(statistics[2]).toMatchObject({
      format: GameStatisticFormat.percentage,
      grouping: GameStatisticGrouping.none,
      sortOrder: GameStatisticSortOrder.None,
    });
    expect(statistics[3]).toMatchObject({
      format: GameStatisticFormat.timer,
      grouping: GameStatisticGrouping.team,
      sortOrder: GameStatisticSortOrder.Descending,
    });
  });

  it("errors on invalid sort order values", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text none 2
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("2");
  });
});
