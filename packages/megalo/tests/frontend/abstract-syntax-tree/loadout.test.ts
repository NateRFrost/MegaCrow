import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../src/diagnostics";
import {
  SymbolKind,
  type SymbolTableLoadoutEntry,
} from "../../../src/frontend/symbol-table";
import { Lexer } from "../../../src/frontend/tokens";
import { MEGALO_VERSIONS } from "../../../src/version";
import { MegaloCompilerContext } from "../../../src/context";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

const loadoutSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableLoadoutEntry =>
      entry.kind === SymbolKind.Loadout
  );

describe("loadoutParser", () => {
  it("parses a loadout block with item parameters", () => {
    const source = `loadout loadout_scout
\tname loadout_name_scout
\tprimary_weapon assault_rifle
\tbackpack_weapon magnum
\tequipment sprint_equipment
\tgrenades 2 frag
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.LOADOUT);
    if (element.elementKind !== ElementKind.LOADOUT) {
      return;
    }

    expect(element.name).toMatchObject({ value: "loadout_scout" });
    expect(element.items).toHaveLength(5);
    expect(element.items[0]).toMatchObject({
      identifier: "name",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "loadout_name_scout" }],
    });
    expect(element.items[1]).toMatchObject({
      identifier: "primary_weapon",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "assault_rifle" }],
    });
    expect(element.items[4]).toMatchObject({
      identifier: "grenades",
      parameters: [
        {
          kind: SyntaxKind.GRENADE_COUNT,
          form: "typed",
          count: { kind: SyntaxKind.INTEGER, value: 2 },
          grenadeType: { kind: SyntaxKind.KEYWORD, value: "frag" },
        },
      ],
    });

    expect(loadoutSymbols(symbolTable).map((entry) => entry.name)).toEqual([
      "loadout_scout",
    ]);
  });

  it("parses grenades keyword presets", () => {
    const source = `loadout loadout_empty
\tgrenades none
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.LOADOUT) {
      return;
    }

    expect(element.items[0]).toMatchObject({
      identifier: "grenades",
      parameters: [
        {
          kind: SyntaxKind.GRENADE_COUNT,
          form: "preset",
          value: { kind: SyntaxKind.KEYWORD, value: "none" },
        },
      ],
    });
  });

  it("reports unknown loadout properties", () => {
    const source = `loadout loadout_bad
\tnot_a_property 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain(
      "Expected loadout property"
    );
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.LOADOUT) {
      return;
    }

    expect(element.items).toHaveLength(0);
  });

  it("reports missing end before eof", () => {
    const source = `loadout loadout_scout
\tname loadout_name_scout
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });

  it("warns when a duplicate loadout name is declared (first wins)", () => {
    const source = `loadout shared_loadout
\tname loadout_name_scout
end
loadout shared_loadout
\tname loadout_name_scout
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_loadout");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");
    expect(
      loadoutSymbols(symbolTable).filter((e) => e.name === "shared_loadout")
    ).toHaveLength(2);
  });
});
