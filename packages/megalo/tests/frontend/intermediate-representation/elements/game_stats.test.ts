import { describe, expect, it } from "vitest";
import objectLists from "../../../../src/object-lists/haloreach_mcc/default";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../../src/diagnostics";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
import {
  GameStatisticFormat,
  GameStatisticGrouping,
  GameStatisticSortOrder,
} from "../../../../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import { Lexer } from "../../../../src/frontend/tokens";

import { MEGALO_VERSIONS } from "../../../../src/version";
import { MegaloCompilerContext } from "../../../../src/context";

const lower = (source: string) => {
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const diagnostics = new Diagnostics();
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, objectLists);
  const ir = new Lowerer(frontend).lower(
    ast,
    diagnostics,
    { objectLists }
  );
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
      format: GameStatisticFormat.Number,
      grouping: GameStatisticGrouping.Player,
      sortOrder: GameStatisticSortOrder.Descending,
    });
    expect(statistics[1]).toMatchObject({
      format: GameStatisticFormat.NumberWithSign,
      grouping: GameStatisticGrouping.Team,
      sortOrder: GameStatisticSortOrder.Ascending,
    });
    expect(statistics[2]).toMatchObject({
      format: GameStatisticFormat.Percentage,
      grouping: GameStatisticGrouping.Player,
      sortOrder: GameStatisticSortOrder.None,
    });
    expect(statistics[3]).toMatchObject({
      format: GameStatisticFormat.Time,
      grouping: GameStatisticGrouping.Team,
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
