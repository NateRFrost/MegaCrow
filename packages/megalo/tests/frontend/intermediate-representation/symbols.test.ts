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
import { MEGALO_VERSIONS } from "../../../version";
import { FrontendContext } from "../../../frontend/context";

const version = MEGALO_VERSIONS["107-mcc"];
const frontend = new FrontendContext(version);
const loc = (offset: number, line = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: offset,
    absoluteOffset: offset,
    line,
    column: 1,
  },
  end: {
    localOffset: offset + 1,
    absoluteOffset: offset + 1,
    line,
    column: 2,
  },
});

const pos = (offset: number, line = 1, column = 1) => ({
  localOffset: offset,
  absoluteOffset: offset,
  line,
  column,
});

const addOverlappingTemps = (
  binder: SymbolBinder,
  type: VariableType,
  count: number
): number[] => {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    const id = binder.addVariable({
      name: `t${i}`,
      type,
      declaration: loc(i * 10),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(id, pos(1000));
    ids.push(id);
  }
  return ids;
};

describe("variable slot mapper", () => {
  it("reuses temporary slots when lifetimes do not overlap", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);

    const early = binder.addVariable({
      name: "a",
      type: VariableType.Number,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(early, pos(10));

    const late = binder.addVariable({
      name: "b",
      type: VariableType.Number,
      declaration: loc(20),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(late, pos(30));

    const slots = buildVariableSlotMap(
      frontend,
      binder.getSymbolTable(),
      diagnostics
    );

    expect(getVariableSlot(slots, early)).toBe(0);
    expect(getVariableSlot(slots, late)).toBe(0);
    expect(slots.get(early)?.scope).toBe(VariableScope.Temporary);
    expect(diagnostics.hasErrors()).toBe(false);
  });

  it("reuses temporary slots across sibling for_each from parsed scopes", () => {
    const source = `trigger local
action for_each player
\ttemporary number a 0
end
action for_each player
\ttemporary number b 0
end
end
`;
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(frontend).lex(source, diagnostics);
    const ast = new Parser(frontend).parse(tokens, diagnostics);
    const slots = buildVariableSlotMap(frontend, ast.symbolTable, diagnostics);

    expect(diagnostics.hasErrors()).toBe(false);
    const a = ast.symbolTable.findVariableByName("a");
    const b = ast.symbolTable.findVariableByName("b");
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(getVariableSlot(slots, a!.id)).toBe(0);
    expect(getVariableSlot(slots, b!.id)).toBe(0);
  });

  it("keeps overlapping temporaries in distinct slots", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);

    const outer = binder.addVariable({
      name: "outer",
      type: VariableType.Object,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(outer, pos(100));

    const nested = binder.addVariable({
      name: "nested",
      type: VariableType.Object,
      declaration: loc(20),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(nested, pos(40));

    const slots = buildVariableSlotMap(
      frontend,
      binder.getSymbolTable(),
      diagnostics
    );

    expect(getVariableSlot(slots, outer)).toBe(0);
    expect(getVariableSlot(slots, nested)).toBe(1);
  });

  it("overflows temporary slots into free global slots", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    // MCC: temporary numbers = 10, global numbers = 12.
    const ids = addOverlappingTemps(binder, VariableType.Number, 11);

    const slots = buildVariableSlotMap(
      frontend,
      binder.getSymbolTable(),
      diagnostics
    );

    expect(slots.get(ids[0]!)?.scope).toBe(VariableScope.Temporary);
    expect(slots.get(ids[0]!)?.index).toBe(0);
    expect(slots.get(ids[9]!)?.scope).toBe(VariableScope.Temporary);
    expect(slots.get(ids[10]!)?.scope).toBe(VariableScope.Global);
    expect(diagnostics.hasErrors()).toBe(false);
  });

  it("does not overflow temporaries when compiler setting is off", () => {
    const diagnostics = new Diagnostics();
    const noOverflowFrontend = new FrontendContext(version, undefined, {
      temporaryVariablesCanOverflowIntoUnusedGlobalVariables: false,
    });
    const binder = new SymbolBinder(noOverflowFrontend, diagnostics);
    const ids = addOverlappingTemps(binder, VariableType.Number, 11);

    const slots = buildVariableSlotMap(
      noOverflowFrontend,
      binder.getSymbolTable(),
      diagnostics
    );

    expect(slots.get(ids[0]!)?.scope).toBe(VariableScope.Temporary);
    expect(slots.get(ids[10]!)?.scope).toBe(VariableScope.Temporary);
    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]!.message).toMatch(/Too many/i);
  });

  it("raises tooManyVariables when overflow cannot fit in globals", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    // MCC: temporary players = 3, global players = 8 → 12 overlapping needs 1 more.
    addOverlappingTemps(binder, VariableType.Player, 12);

    buildVariableSlotMap(frontend, binder.getSymbolTable(), diagnostics);

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
    const tokens = new Lexer(frontend).lex(source, diagnostics);
    const ast = new Parser(frontend).parse(tokens, diagnostics);
    const ir = new Lowerer(frontend).lower(ast, diagnostics);

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
    const tokens = new Lexer(frontend).lex(source, diagnostics);
    const ast = new Parser(frontend).parse(tokens, diagnostics);
    const temp = ast.symbolTable.findVariableByName("t");
    expect(temp?.scope).toBe(VariableScope.Temporary);
  });
});
