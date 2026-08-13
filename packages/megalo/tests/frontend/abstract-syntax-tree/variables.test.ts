import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../src/frontend/abstract-syntax-tree";
import { ElementKind } from "../../../src/frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../src/diagnostics";
import {
  SymbolKind,
  type SymbolTableVariableEntry,
  VariableScope,
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

const variableSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableVariableEntry =>
      entry.kind === SymbolKind.Variable
  );

describe("variablesParser", () => {
  it("parses a global variables block", () => {
    const source = `variables team
\tnetworked team defenders none
end
variables global
\tnetworked timer sd_vo 35
\tnetworked team defending_team defenders
\tnetworked object the_flag none
\tnetworked number invasion_phase 1
\tlocal number should_progress -1
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[1]!;
    expect(element.elementKind).toBe(ElementKind.VARIABLES);
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }

    expect(element.scope).toMatchObject({ value: "global" });
    expect(element.entries).toHaveLength(5);
    expect(element.entries[0]).toMatchObject({
      network: { value: "networked" },
      type: { value: "timer" },
      name: { value: "sd_vo" },
      initial: { kind: SyntaxKind.INTEGER, value: 35 },
    });
    expect(element.entries[1]).toMatchObject({
      type: { value: "team" },
      name: { value: "defending_team" },
      initial: { kind: SyntaxKind.REFERENCE, identifier: "defenders" },
    });
    expect(element.entries[2]).toMatchObject({
      type: { value: "object" },
      name: { value: "the_flag" },
      initial: { kind: SyntaxKind.REFERENCE, identifier: "none" },
    });
    expect(element.entries[3]).toMatchObject({
      type: { value: "number" },
      name: { value: "invasion_phase" },
      initial: { kind: SyntaxKind.INTEGER, value: 1 },
    });
    expect(element.entries[4]).toMatchObject({
      network: { value: "local" },
      type: { value: "number" },
      name: { value: "should_progress" },
      initial: { kind: SyntaxKind.INTEGER, value: -1 },
    });

    const variables = variableSymbols(symbolTable);
    expect(
      variables.find(
        (entry) =>
          entry.name === "defenders" && entry.scope === VariableScope.Team
      )
    ).toBeDefined();
    expect(variables.find((entry) => entry.name === "sd_vo")).toBeDefined();
    expect(
      variables.find((entry) => entry.name === "defending_team")
    ).toBeDefined();
  });

  it("resolves team designators as initial values without a same-named variable", () => {
    const source = `variables global
\tnetworked team defending_team defenders
\tnetworked team attacking_team attackers
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.VARIABLES);
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }

    const defendersId = variableSymbols(symbolTable).find(
      (entry) =>
        entry.name === "defenders" && entry.scope === VariableScope.Global
    )?.id;
    const attackersId = variableSymbols(symbolTable).find(
      (entry) =>
        entry.name === "attackers" && entry.scope === VariableScope.Global
    )?.id;

    expect(defendersId).toBeDefined();
    expect(attackersId).toBeDefined();

    expect(element.entries[0]).toMatchObject({
      name: { value: "defending_team" },
      initial: { kind: SyntaxKind.REFERENCE, identifier: "defenders" },
    });
    expect(element.entries[1]).toMatchObject({
      name: { value: "attacking_team" },
      initial: { kind: SyntaxKind.REFERENCE, identifier: "attackers" },
    });
  });

  it("parses scoped variable blocks", () => {
    const source = `variables player
\tnetworked timer cooldown 0
end
variables team
\tnetworked object goal none
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.elements).toHaveLength(2);

    const playerBlock = ast.elements[0]!;
    const teamBlock = ast.elements[1]!;
    if (
      playerBlock.elementKind !== ElementKind.VARIABLES ||
      teamBlock.elementKind !== ElementKind.VARIABLES
    ) {
      return;
    }

    expect(playerBlock.scope).toMatchObject({ value: "player" });
    expect(teamBlock.scope).toMatchObject({ value: "team" });

    const playerVar = variableSymbols(symbolTable).find(
      (entry) => entry.name === "cooldown"
    );
    const teamVar = variableSymbols(symbolTable).find(
      (entry) => entry.name === "goal"
    );
    expect(playerVar?.scope).toBe(2);
    expect(teamVar?.scope).toBe(1);
  });

  it("parses numeric initial values that reference constants", () => {
    const source = `constants
\tnumber k_game_state_one_intro 1
end
variables global
\tnetworked number cinematic_state k_game_state_one_intro
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }

    expect(element.entries[0]?.initial).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "k_game_state_one_intro",
    });
  });

  it("accepts any network identifier at parse time", () => {
    const source = `variables global
\tlocal timer bad_timer 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      network: { value: "local" },
      type: { value: "timer" },
      initial: { kind: SyntaxKind.INTEGER, value: 1 },
    });
  });

  it("parses a variable named end", () => {
    const source = `variables global
\tlocal number end 0
\tnetworked number other 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.VARIABLES) {
      return;
    }

    expect(element.entries).toHaveLength(2);
    expect(element.entries[0]?.name).toMatchObject({ value: "end" });
    expect(element.entries[1]?.name).toMatchObject({ value: "other" });
  });

  it("reports missing end before eof", () => {
    const source = `variables global
\tnetworked number x 0
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });

  it("warns when a duplicate global timer name is declared (first wins)", () => {
    const source = `variables global
\tnetworked timer shared_timer 5
\tnetworked timer shared_timer 99
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_timer");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    const timers = variableSymbols(symbolTable).filter(
      (entry) => entry.name === "shared_timer"
    );
    expect(timers).toHaveLength(2);
  });

  it("warns when a duplicate member variable name is declared (first wins)", () => {
    const source = `variables player
\tlocal number shared_flag 0
\tlocal number shared_flag 1
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(1);
    expect(diagnostics.getWarnings()[0]?.message).toContain("shared_flag");
    expect(diagnostics.getWarnings()[0]?.message).toContain("ignored");

    expect(
      variableSymbols(symbolTable).filter((e) => e.name === "shared_flag")
    ).toHaveLength(2);
  });

  it("does not warn when a duplicate global number shadows (last wins)", () => {
    const source = `variables global
\tlocal number counter 0
\tlocal number counter 7
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(diagnostics.getWarnings()).toHaveLength(0);
  });
});
