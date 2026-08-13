import { describe, expect, it } from "vitest";
import { MegaloCompilerContext } from "../../../src/context";
import {
  BUILT_IN_LOCATION,
  Diagnostics,
  type SourceCodeLocation,
  SourceLocationType,
} from "../../../src/diagnostics";
import { ParserSymbolContext } from "../../../src/frontend/abstract-syntax-tree/symbol-context";
import {
  buildVariableSlotMap,
  findVariableBySlot,
} from "../../../src/frontend/intermediate-representation/preprocessing/symbols";
import { TEAM_DESIGNATORS } from "../../../src/frontend/language-configuration/omni/teams";
import {
  isBuiltInVariable,
  SymbolBinder,
  SymbolKind,
  type SymbolTableStringEntry,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
} from "../../../src/frontend/symbol-table";
import { ParserScopeKind } from "../../../src/frontend/symbol-table/scope";
import { MEGALO_VERSIONS } from "../../../src/version";

const version = MEGALO_VERSIONS["107-mcc"];
const frontend = new MegaloCompilerContext(version);

const loc = (line: number, column = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: 0,
    absoluteOffset: 0,
    line,
    column,
  },
  end: {
    localOffset: 0,
    absoluteOffset: 0,
    line,
    column: column + 1,
  },
});

const createBinder = () => new SymbolBinder(frontend, new Diagnostics());

describe("SymbolBinder", () => {
  it("addString creates a string symbol with language declaration", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const declaration = loc(2, 5);

    const id = binder.addString({
      name: "slayer_title",
      language: "english",
      content: "Slayer",
      declaration,
    });

    expect(id).toBe(0);
    expect(diagnostics.hasErrors()).toBe(false);

    const [entry] = binder.getSymbolTable().toArray();
    expect(entry).toMatchObject({
      id: 0,
      name: "slayer_title",
      kind: SymbolKind.String,
      references: [],
    });

    const stringEntry = entry as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.english).toEqual(declaration);
    expect(stringEntry.languageContents.english).toBe("Slayer");
  });

  it("addString merges language declarations for the same symbol name", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const englishDeclaration = loc(2);
    const frenchDeclaration = loc(5);

    const englishId = binder.addString({
      name: "msg_welcome",
      language: "english",
      content: "Welcome %p",
      declaration: englishDeclaration,
    });
    const frenchId = binder.addString({
      name: "msg_welcome",
      language: "french",
      content: "Bienvenue %p",
      declaration: frenchDeclaration,
    });

    expect(englishId).toBe(0);
    expect(frenchId).toBe(0);
    expect(diagnostics.hasErrors()).toBe(false);
    expect(binder.getSymbolTable().toArray()).toHaveLength(1);

    const stringEntry = binder
      .getSymbolTable()
      .toArray()[0] as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.english).toEqual(
      englishDeclaration
    );
    expect(stringEntry.languageDeclarations.french).toEqual(frenchDeclaration);
    expect(stringEntry.languageContents.english).toBe("Welcome %p");
    expect(stringEntry.languageContents.french).toBe("Bienvenue %p");
  });

  it("addString reports duplicate declarations for the same language", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const firstDeclaration = loc(2);
    const duplicateDeclaration = loc(3);

    binder.addString({
      name: "msg_welcome",
      language: "english",
      content: "Welcome",
      declaration: firstDeclaration,
    });
    const duplicateId = binder.addString({
      name: "msg_welcome",
      language: "english",
      content: "Welcome again",
      declaration: duplicateDeclaration,
    });

    expect(duplicateId).toBeUndefined();
    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("msg_welcome");
    expect(diagnostics.getErrors()[0]?.location).toEqual(duplicateDeclaration);

    const stringEntry = binder
      .getSymbolTable()
      .toArray()[0] as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.english).toEqual(firstDeclaration);
    expect(stringEntry.languageContents.english).toBe("Welcome");
    expect(Object.keys(stringEntry.languageDeclarations)).toHaveLength(1);
  });

  it("addVariable and addConstant append distinct entries", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const variableDeclaration = loc(1);
    const constantDeclaration = loc(2);

    const variableId = binder.addVariable({
      name: "player_count",
      type: 1,
      declaration: variableDeclaration,
      scope: VariableScope.Global,
    });
    const constantId = binder.addConstant({
      name: "max_score",
      declaration: constantDeclaration,
      value: 100,
    });

    expect(variableId).toBe(0);
    expect(constantId).toBe(1);
    expect(diagnostics.hasErrors()).toBe(false);

    const table = binder.getSymbolTable().toArray();
    expect(table).toHaveLength(2);
    expect(table[0]).toMatchObject({
      id: 0,
      name: "player_count",
      kind: SymbolKind.Variable,
      type: 1,
      declaration: variableDeclaration,
      references: [],
    });
    expect(table[1]).toMatchObject({
      id: 1,
      name: "max_score",
      kind: SymbolKind.Constant,
      type: 1,
      declaration: constantDeclaration,
      references: [],
    });
  });

  it("addReference records reference locations on a symbol", () => {
    const binder = createBinder();
    const declaration = loc(2);
    const reference = loc(10, 8);

    const id = binder.addString({
      name: "msg_welcome",
      language: "english",
      content: "Welcome",
      declaration,
    });
    binder.addReference(id!, reference);

    const stringEntry = binder
      .getSymbolTable()
      .toArray()[0] as SymbolTableStringEntry;
    expect(stringEntry.references).toEqual([reference]);
  });

  it("buildVariableSlotMap assigns sequential slots per (scope, type) and skips built-ins", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);

    const first = binder.addVariable({
      name: "a",
      type: VariableType.Number,
      declaration: loc(1),
      scope: VariableScope.Global,
    });
    const second = binder.addVariable({
      name: "b",
      type: VariableType.Number,
      declaration: loc(2),
      scope: VariableScope.Global,
    });
    const builtIn = binder.addVariable({
      name: "current_player",
      type: VariableType.Player,
      declaration: BUILT_IN_LOCATION,
      scope: VariableScope.Global,
    });
    const playerScoped = binder.addVariable({
      name: "c",
      type: VariableType.Number,
      declaration: loc(4),
      scope: VariableScope.Player,
    });
    const timer = binder.addVariable({
      name: "t",
      type: VariableType.Timer,
      declaration: loc(5),
      scope: VariableScope.Global,
    });

    const table = binder.getSymbolTable();
    const slots = buildVariableSlotMap(frontend, table, diagnostics);

    expect(slots.get(first)?.index).toBe(0);
    expect(slots.get(second)?.index).toBe(1);
    expect(slots.has(builtIn)).toBe(false);
    expect(
      isBuiltInVariable(table.getSymbol(builtIn) as SymbolTableVariableEntry)
    ).toBe(true);
    expect(slots.get(playerScoped)?.index).toBe(0);
    expect(slots.get(timer)?.index).toBe(0);

    expect(
      findVariableBySlot(
        table,
        slots,
        VariableScope.Global,
        VariableType.Number,
        1
      )?.name
    ).toBe("b");
    expect(
      table.variablesOf(VariableScope.Global, VariableType.Number)
    ).toHaveLength(2);
    expect(isBuiltInVariable(table.findVariableByName("current_player")!)).toBe(
      true
    );
  });

  it("registers built-in timers in the global scope", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    for (const name of [
      "round_timer",
      "sudden_death_timer",
      "grace_period_timer",
    ] as const) {
      const id = parser.lookupSymbol(name);
      expect(id).toBeDefined();
      expect(parser.getSymbolEntry(id!)).toMatchObject({
        kind: SymbolKind.Variable,
        type: VariableType.Timer,
        name,
      });
    }
  });

  it("registers team designators as built-in Team variables", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    for (const name of TEAM_DESIGNATORS) {
      const id = parser.lookupSymbol(name);
      expect(id).toBeDefined();
      expect(parser.getSymbolEntry(id!)).toMatchObject({
        kind: SymbolKind.Variable,
        type: VariableType.Team,
        name,
        scope: VariableScope.Global,
      });
    }
  });

  it("registers explicit team refs as built-in Team variables", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    for (const name of ["neutral", "local_team"]) {
      const id = parser.lookupSymbol(name);
      expect(id).toBeDefined();
      expect(parser.getSymbolEntry(id!)).toMatchObject({
        kind: SymbolKind.Variable,
        type: VariableType.Team,
        name,
        scope: VariableScope.Global,
      });
    }

    // MegaCrow extension only (MegaloEdit Headache #2).
    expect(parser.lookupSymbol("target_team")).toBeUndefined();
    // Trigger-scoped only (see addBuiltInScopeVariables).
    expect(parser.lookupSymbol("current_team")).toBeUndefined();
    // Encoding-only slot names are not source-level built-ins.
    expect(parser.lookupSymbol("team_0")).toBeUndefined();
    expect(parser.lookupSymbol("global_team_0")).toBeUndefined();
    expect(parser.lookupSymbol("temporary_team_0")).toBeUndefined();
    expect(parser.lookupSymbol("temporary_0")).toBeUndefined();
  });

  it("registers target_team when the MegaCrow extension is enabled", () => {
    const diagnostics = new Diagnostics();
    const extFrontend = new MegaloCompilerContext(version, {
      targetTeam: true,
    });
    const binder = new SymbolBinder(extFrontend, diagnostics);
    const parser = new ParserSymbolContext(extFrontend, diagnostics, binder);

    const id = parser.lookupSymbol("target_team");
    expect(id).toBeDefined();
    expect(parser.getSymbolEntry(id!)).toMatchObject({
      kind: SymbolKind.Variable,
      type: VariableType.Team,
      name: "target_team",
      scope: VariableScope.Global,
    });
  });

  it("registers always-available player and object refs as built-ins", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    for (const name of ["local_player", "target_player"]) {
      const id = parser.lookupSymbol(name);
      expect(id).toBeDefined();
      expect(parser.getSymbolEntry(id!)).toMatchObject({
        kind: SymbolKind.Variable,
        type: VariableType.Player,
        name,
        scope: VariableScope.Global,
      });
    }

    const targetObject = parser.lookupSymbol("target_object");
    expect(targetObject).toBeDefined();
    expect(parser.getSymbolEntry(targetObject!)).toMatchObject({
      kind: SymbolKind.Variable,
      type: VariableType.Object,
      name: "target_object",
      scope: VariableScope.Global,
    });

    expect(parser.lookupSymbol("current_player")).toBeUndefined();
    expect(parser.lookupSymbol("current_object")).toBeUndefined();
  });

  it("injects current_team only inside team triggers", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    expect(parser.lookupSymbol("current_team")).toBeUndefined();

    parser.pushScope({
      kind: ParserScopeKind.Trigger,
      trigger: { kind: "team" },
    });
    expect(parser.lookupSymbol("current_team")).toBeDefined();
    expect(
      parser.getSymbolEntry(parser.lookupSymbol("current_team")!)
    ).toMatchObject({
      kind: SymbolKind.Variable,
      type: VariableType.Team,
      name: "current_team",
    });

    parser.popScope();
    expect(parser.lookupSymbol("current_team")).toBeUndefined();
  });

  it("lookupStringContent prefers english then falls back to the first language", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    parser.addStringToScope({
      name: "msg_only_french",
      language: "french",
      content: "Bonjour %p",
      declaration: loc(1),
    });
    expect(parser.lookupStringContent("msg_only_french")).toBe("Bonjour %p");

    parser.addStringToScope({
      name: "msg_welcome",
      language: "french",
      content: "Bienvenue %p",
      declaration: loc(2),
    });
    parser.addStringToScope({
      name: "msg_welcome",
      language: "english",
      content: "Welcome %p",
      declaration: loc(3),
    });
    expect(parser.lookupStringContent("msg_welcome")).toBe("Welcome %p");
  });

  it("pushScope and popScope isolate variable lookups", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);
    const parser = new ParserSymbolContext(frontend, diagnostics, binder);

    parser.addVariableToScope({
      name: "outer_var",
      type: VariableType.Number,
      declaration: loc(1),
      scope: VariableScope.Global,
    });

    parser.pushScope({ kind: ParserScopeKind.Block });
    parser.addVariableToScope({
      name: "inner_var",
      type: VariableType.Number,
      declaration: loc(2),
      scope: VariableScope.Global,
    });

    expect(parser.lookupSymbol("inner_var")).toBeDefined();
    expect(parser.lookupSymbol("outer_var")).toBeDefined();
    expect(parser.currentScopeIsGlobal()).toBe(false);

    parser.popScope();

    expect(parser.lookupSymbol("inner_var")).toBeUndefined();
    expect(parser.lookupSymbol("outer_var")).toBeDefined();
    expect(parser.currentScopeIsGlobal()).toBe(true);
  });
});
