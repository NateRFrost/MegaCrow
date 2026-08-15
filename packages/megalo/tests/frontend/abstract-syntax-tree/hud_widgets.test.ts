import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import { Diagnostics } from "../../../src/diagnostics";
import { Parser } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import {
  SymbolKind,
  type SymbolTableHudWidgetEntry,
} from "../../../src/frontend/symbol-table";
import { Lexer } from "../../../src/frontend/tokens";
import type { MegacrowExtensions } from "../../../src/megacrow-extensions";
import { MEGALO_VERSIONS } from "../../../src/version";

const parse = (
  source: string,
  megacrowExtensions?: Partial<MegacrowExtensions>
) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const frontend = new MegaloCompilerContext(version, megacrowExtensions);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

const hudWidgetSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableHudWidgetEntry =>
      entry.kind === SymbolKind.HudWidget
  );

describe("hudWidgetsParser", () => {
  it("parses a hud_widgets block with custom and built-in widget names", () => {
    const source = `hud_widgets
\tattacker_widget top_left
\tdefender_widget top_left
\tproximity_warning high_center
\tarming_warning low_center
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.HUD_WIDGETS);
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries).toHaveLength(4);
    expect(element.entries[0]).toMatchObject({
      name: { value: "attacker_widget" },
      position: { value: "top_left" },
    });
    expect(element.entries[2]).toMatchObject({
      name: { value: "proximity_warning" },
      position: { value: "high_center" },
    });

    expect(hudWidgetSymbols(symbolTable).map((entry) => entry.name)).toEqual([
      "attacker_widget",
      "defender_widget",
      "proximity_warning",
      "arming_warning",
    ]);
  });

  it("parses widget entries without validating position names", () => {
    const source = `hud_widgets
\twatermark not_a_position
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      name: { value: "watermark" },
      position: { value: "not_a_position" },
    });
  });

  it("reports missing end before eof", () => {
    const source = `hud_widgets
\twatermark bottom_center
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });

  it("warns when a duplicate hud_widget name is declared (first wins)", () => {
    const source = `hud_widgets
\tshared_widget top_left
\tshared_widget bottom_center
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_widget");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    expect(
      hudWidgetSymbols(symbolTable).filter((e) => e.name === "shared_widget")
    ).toHaveLength(2);
  });

  it("errors on legacy text-prefixed entries without supportLegacySyntax", () => {
    const source = `hud_widgets
\ttext tier_widget top_left
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("MegaloEdit");
    expect(diagnostics.getWarnings()).toHaveLength(0);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }
    expect(element.entries[0]).toMatchObject({
      textKeyword: { value: "text" },
      name: { value: "tier_widget" },
      position: { value: "top_left" },
    });
  });

  it("warns on legacy text-prefixed entries when supportLegacySyntax is enabled", () => {
    const source = `hud_widgets
\ttext tier_widget top_left
\ttext game_time_widget top_left
\ttext proximity_warning top_center
end
`;

    const { ast, symbolTable, diagnostics } = parse(source, {
      supportLegacySyntax: true,
    });

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(3);
    for (const warning of diagnostics.getWarnings()) {
      expect(warning.message).toContain("text");
      expect(warning.message).toContain("MegaloEdit");
    }

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.HUD_WIDGETS);
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries).toHaveLength(3);
    expect(element.entries[0]).toMatchObject({
      textKeyword: { value: "text" },
      name: { value: "tier_widget" },
      position: { value: "top_left" },
    });
    expect(hudWidgetSymbols(symbolTable).map((entry) => entry.name)).toEqual([
      "tier_widget",
      "game_time_widget",
      "proximity_warning",
    ]);
  });

  it("does not warn about legacy text prefix below version 106", () => {
    const source = `hud_widgets
\ttext tier_widget top_left
end
`;
    const diagnostics = new Diagnostics();
    const frontend = new MegaloCompilerContext(MEGALO_VERSIONS["107-mcc"]);
    Object.defineProperty(frontend, "megaloVersion", {
      configurable: true,
      get: () => ({ version: 49 }),
    });
    const tokens = new Lexer(frontend).lex(source, diagnostics);
    new Parser(frontend).parse(tokens, diagnostics);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(0);
  });

  it("keeps a widget named text parsable without a legacy prefix", () => {
    const source = `hud_widgets
\ttext top_left
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(
      diagnostics
        .getWarnings()
        .filter((warning) => warning.message.includes("MegaloEdit"))
        .concat(
          diagnostics
            .getErrors()
            .filter((error) => error.message.includes("MegaloEdit"))
        )
    ).toHaveLength(0);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      name: { value: "text" },
      position: { value: "top_left" },
    });
    expect(element.entries[0]?.textKeyword).toBeUndefined();
  });
});
