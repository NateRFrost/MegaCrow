import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../../src/context";
import { Diagnostics } from "../../../../src/diagnostics";
import { Parser } from "../../../../src/frontend/abstract-syntax-tree";
import { Lowerer } from "../../../../src/frontend/intermediate-representation";
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

describe("player_rating lowering", () => {
  it("lowers rating parameters including base_value rename and scoreboard flag", () => {
    const source = `player_rating
\tkill_weight 1
\tassist_weight 0.5
\tbetrayal_weight 1
\tdeath_weight 0.5
\tloss_scalar 1
\trating_scale 1
\tnormalize_by_max_kills 1
\tbase_value 1000
\trange 1000
\tcustom_stat_0 0
\tcustom_stat_1 0
\tcustom_stat_2 0
\tcustom_stat_3 0
\tshow_in_scoreboard 0
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.playerRatings).toEqual({
      killWeight: 1,
      assistWeight: 0.5,
      betrayalWeight: 1,
      deathWeight: 0.5,
      lossScalar: 1,
      ratingScale: 1,
      normalizeByMaxKills: 1,
      base: 1000,
      range: 1000,
      customStat0: 0,
      customStat1: 0,
      customStat2: 0,
      customStat3: 0,
      showInScoreboard: false,
    });
  });

  it("treats nonzero show_in_scoreboard as true", () => {
    const source = `player_rating
\tshow_in_scoreboard 1
end
`;
    const { ir, diagnostics } = lower(source);

    expect(diagnostics.getErrors()).toEqual([]);
    expect(ir.gameVariant.playerRatings?.showInScoreboard).toBe(true);
  });

  it("errors on unknown fields", () => {
    const source = `player_rating
\tfuture_field 1
end
`;
    const { diagnostics } = lower(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("kill_weight");
  });
});
