import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import { SymbolKind } from "../../../src/frontend/symbol-table";
import { Lexer } from "../../../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../../../src/version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

describe("gameStatsParser", () => {
  it("parses game_stats entries with five fields per line", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
\tstat_carry_time_text "Carry Time"
\tstat_plants_text "Plants"
\tstat_returns_text "Returns"
end
game_stats
\tstat_caps number stat_caps_text none 1
\tstat_carry_time timer stat_carry_time_text none 0
\tstat_plants number stat_plants_text none 0
\tstat_returns number stat_returns_text none 0
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[1]!;
    expect(element.elementKind).toBe(ElementKind.GAME_STATS);
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries).toHaveLength(4);
    expect(element.entries[0]).toMatchObject({
      name: { value: "stat_caps" },
      type: { value: "number" },
      labelString: { kind: SyntaxKind.REFERENCE, identifier: "stat_caps_text" },
      grouping: { kind: SyntaxKind.KEYWORD, value: "none" },
      sort: { kind: SyntaxKind.INTEGER, value: 1 },
    });
    expect(element.entries[1]).toMatchObject({
      name: { value: "stat_carry_time" },
      type: { value: "timer" },
      labelString: {
        kind: SyntaxKind.REFERENCE,
        identifier: "stat_carry_time_text",
      },
      grouping: { kind: SyntaxKind.KEYWORD, value: "none" },
      sort: { kind: SyntaxKind.INTEGER, value: 0 },
    });
  });

  it("parses label_string fields as string references", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text none 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries[0]?.labelString).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "stat_caps_text",
    });
  });

  it("parses label_string as a string literal or string reference", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number "Caps" none 1
\tstat_score number stat_caps_text team -1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries[0]?.labelString).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Caps",
    });
    expect(element.entries[1]).toMatchObject({
      labelString: { kind: SyntaxKind.REFERENCE, identifier: "stat_caps_text" },
      grouping: { kind: SyntaxKind.KEYWORD, value: "team" },
      sort: { kind: SyntaxKind.INTEGER, value: -1 },
    });
  });

  it("reports unknown grouping keywords", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text player 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("player");
  });

  it("reports unknown statistic format types", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps not_a_type stat_caps_text none 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_type");
  });

  it("reports unresolved label_string references", () => {
    const source = `game_stats
\tstat_caps number missing_label none 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("missing_label");
  });

  it("reports missing end before eof", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text none 1
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(
      diagnostics.getErrors().some((error) => error.message.includes("end"))
    ).toBe(true);
  });

  it("warns when a duplicate game_stats name is declared (first wins)", () => {
    const source = `string_table english
\tlabel_a "A"
\tlabel_b "B"
end
game_stats
\tshared_stat number label_a none 1
\tshared_stat number label_b none 0
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_stat");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    const stats = symbolTable.filter(
      (entry) =>
        entry.kind === SymbolKind.GameStat && entry.name === "shared_stat"
    );
    expect(stats).toHaveLength(2);
    expect(stats[0]).toMatchObject({ index: 0 });
    expect(stats[1]).toMatchObject({ index: 1 });
  });
});
