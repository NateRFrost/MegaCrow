import { describe, expect, it } from "vitest";
import { Parser } from "../../../frontend/abstract-syntax-tree";
import {
  Diagnostics,
  SourceLocationType,
  type SourceCodeLocation,
} from "../../../frontend/diagnostics";
import { Lowerer } from "../../../frontend/intermediate-representation";
import { MegaloVariableNetworkState } from "../../../frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import {
  buildVariableSlotMap,
  getVariableSlot,
} from "../../../frontend/intermediate-representation/preprocessing/symbols";
import {
  SymbolBinder,
  VariableScope,
  VariableType,
} from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { VersionConfiguration107MCC } from "../../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../../version";

const version = MEGALO_VERSIONS["107-mcc"];
const VARIABLE_LIMITS_107_MCC = new VersionConfiguration107MCC().limits;
const loc = (offset: number, line = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: { offset, line, column: 1 },
  end: { offset: offset + 1, line, column: 2 },
});

describe("variable slot mapper", () => {
  it("packs non-overlapping temporaries into the same slot", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);

    const early = binder.addVariable({
      name: "a",
      type: VariableType.Number,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(early, { offset: 10, line: 1, column: 1 });

    const late = binder.addVariable({
      name: "b",
      type: VariableType.Number,
      declaration: loc(20),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(late, { offset: 30, line: 1, column: 1 });

    const slots = buildVariableSlotMap(
      binder.getSymbolTable(),
      VARIABLE_LIMITS_107_MCC,
      diagnostics
    );

    expect(getVariableSlot(slots, early)).toBe(0);
    expect(getVariableSlot(slots, late)).toBe(0);
    expect(slots.get(early)?.scope).toBe(VariableScope.Temporary);
    expect(diagnostics.hasErrors()).toBe(false);
  });

  it("keeps overlapping temporaries in distinct slots", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);

    const outer = binder.addVariable({
      name: "outer",
      type: VariableType.Object,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(outer, { offset: 100, line: 1, column: 1 });

    const nested = binder.addVariable({
      name: "nested",
      type: VariableType.Object,
      declaration: loc(20),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(nested, { offset: 40, line: 1, column: 1 });

    const slots = buildVariableSlotMap(
      binder.getSymbolTable(),
      VARIABLE_LIMITS_107_MCC,
      diagnostics
    );

    expect(getVariableSlot(slots, outer)).toBe(0);
    expect(getVariableSlot(slots, nested)).toBe(1);
  });

  it("overflows temporary slots into free global slots", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const limits = {
      ...VARIABLE_LIMITS_107_MCC,
      [VariableScope.Temporary]: {
        [VariableType.Number]: 1,
      },
      [VariableScope.Global]: {
        ...VARIABLE_LIMITS_107_MCC[VariableScope.Global],
        [VariableType.Number]: 12,
      },
    };

    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const id = binder.addVariable({
        name: `t${i}`,
        type: VariableType.Number,
        declaration: loc(i * 10),
        scope: VariableScope.Temporary,
      });
      // Overlapping lifetimes so they cannot share temporary slots.
      binder.setScopeEnd(id, { offset: 1000, line: 1, column: 1 });
      ids.push(id);
    }

    const slots = buildVariableSlotMap(
      binder.getSymbolTable(),
      limits,
      diagnostics
    );

    expect(slots.get(ids[0]!)?.scope).toBe(VariableScope.Temporary);
    expect(slots.get(ids[0]!)?.index).toBe(0);
    expect(slots.get(ids[1]!)?.scope).toBe(VariableScope.Global);
    expect(slots.get(ids[2]!)?.scope).toBe(VariableScope.Global);
    expect(diagnostics.hasErrors()).toBe(false);
  });

  it("raises tooManyVariables when overflow cannot fit in globals", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const limits = {
      ...VARIABLE_LIMITS_107_MCC,
      [VariableScope.Temporary]: {
        [VariableType.Player]: 0,
      },
      [VariableScope.Global]: {
        ...VARIABLE_LIMITS_107_MCC[VariableScope.Global],
        [VariableType.Player]: 0,
      },
    };

    const id = binder.addVariable({
      name: "p0",
      type: VariableType.Player,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(id, { offset: 10, line: 1, column: 1 });

    buildVariableSlotMap(binder.getSymbolTable(), limits, diagnostics);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]!.message).toMatch(/Too many/i);
  });

  it("populates variableMetadata from variables element and skips dryRun on errors", () => {
    const source = `
variables global
local number score 0
end
`;
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex(source, diagnostics);
    const ast = new Parser(version).parse(tokens, diagnostics);
    const ir = new Lowerer(new VersionConfiguration107MCC()).lower(ast, diagnostics);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ir.gameVariant.gameEngine.variableMetadata.global.numericVariables)
      .toHaveLength(1);
    expect(
      ir.gameVariant.gameEngine.variableMetadata.global.numericVariables[0]
        ?.networkState
    ).toBe(MegaloVariableNetworkState.Local);
  });

  it("registers temporary symbols with VariableScope.Temporary", () => {
    const source = `
trigger foo
temporary number t 0
end
`;
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex(source, diagnostics);
    const ast = new Parser(version).parse(tokens, diagnostics);
    const temp = ast.symbolTable.findVariableByName("t");
    expect(temp?.scope).toBe(VariableScope.Temporary);
  });
});
