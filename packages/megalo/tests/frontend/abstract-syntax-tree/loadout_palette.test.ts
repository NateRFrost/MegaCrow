import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import {
  SymbolKind,
  type SymbolTableLoadoutPaletteEntry,
} from "../../../src/frontend/symbol-table";
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

const loadoutPaletteSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableLoadoutPaletteEntry =>
      entry.kind === SymbolKind.LoadoutPalette
  );

const minimalLoadout = (name: string) => `loadout ${name}
\tname ${name}_label
end
`;

describe("loadoutPaletteParser", () => {
  it("parses loadout_palette blocks with item loadout references", () => {
    const source = `${minimalLoadout("loadout_scout")}
${minimalLoadout("loadout_ninja")}
${minimalLoadout("loadout_air_assault")}
${minimalLoadout("loadout_specter")}
${minimalLoadout("loadout_guard")}
loadout_palette slayer_loadouts_t1
\titem loadout_scout
\titem loadout_ninja
end
loadout_palette slayer_loadouts_t2
\titem loadout_scout
\titem loadout_ninja
\titem loadout_air_assault
\titem loadout_specter
end
loadout_palette slayer_loadouts_t3
\titem loadout_scout
\titem loadout_ninja
\titem loadout_air_assault
\titem loadout_specter
\titem loadout_guard
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const palettes = ast.elements.filter(
      (element) => element.elementKind === ElementKind.LOADOUT_PALETTE
    );
    expect(palettes).toHaveLength(3);

    const tier1 = palettes[0]!;
    if (tier1.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(tier1.name).toMatchObject({ value: "slayer_loadouts_t1" });
    expect(tier1.items).toHaveLength(2);
    expect(tier1.items[0]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_scout",
    });
    expect(tier1.items[1]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_ninja",
    });

    const tier3 = palettes[2]!;
    if (tier3.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(tier3.items).toHaveLength(5);
    expect(tier3.items[4]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_guard",
    });

    expect(
      loadoutPaletteSymbols(symbolTable).map((entry) => entry.name)
    ).toEqual([
      "slayer_loadouts_t1",
      "slayer_loadouts_t2",
      "slayer_loadouts_t3",
    ]);
  });

  it("reports unknown loadout palette properties", () => {
    const source = `${minimalLoadout("loadout_scout")}
loadout_palette slayer_loadouts_t1
\tnot_a_property loadout_scout
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("item or end");
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements.find(
      (entry) => entry.elementKind === ElementKind.LOADOUT_PALETTE
    );
    if (element?.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(element.items).toHaveLength(0);
  });

  it("parses unresolved loadout references leniently", () => {
    const source = `loadout_palette slayer_loadouts_t1
\titem loadout_scout
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements.find(
      (entry) => entry.elementKind === ElementKind.LOADOUT_PALETTE
    );
    if (element?.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(element.items[0]).toMatchObject({
      kind: SyntaxKind.KEYWORD,
      value: "loadout_scout",
    });
  });

  it("reports missing end before eof", () => {
    const source = `${minimalLoadout("loadout_scout")}
loadout_palette slayer_loadouts_t1
\titem loadout_scout
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });

  it("warns when a duplicate loadout_palette name is declared (first wins)", () => {
    const source = `${minimalLoadout("loadout_scout")}
loadout_palette shared_palette
\titem loadout_scout
end
loadout_palette shared_palette
\titem loadout_scout
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_palette");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    const palettes = symbolTable.filter(
      (entry) =>
        entry.kind === SymbolKind.LoadoutPalette &&
        entry.name === "shared_palette"
    );
    expect(palettes).toHaveLength(2);
  });
});
