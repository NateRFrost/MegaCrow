import { describe, expect, it } from "vitest";
import { CAPABILITES_106 } from "../src/backend/compile/106/capabilities";
import { Compiler } from "../src/backend/compile/compiler";
import { assertCompatibleIR } from "../src/backend/compile/diagnostics/assertCompatibleIR";
import { compileSource } from "../src/compile-source";
import { MegaloCompilerContext } from "../src/context";
import {
  DiagnosticSeverity,
  Diagnostics,
  type SourceCodeLocation,
  SourceLocationType,
} from "../src/diagnostics";
import {
  createFieldLocations,
  type IR,
} from "../src/frontend/intermediate-representation";
import {
  actionType,
  mathOperation,
} from "../src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { StringTable } from "../src/frontend/intermediate-representation/game/string_table";
import { buildVariableSlotMap } from "../src/frontend/intermediate-representation/preprocessing/symbols";
import {
  SymbolBinder,
  VariableScope,
  VariableType,
} from "../src/frontend/symbol-table";
import { getLabel, MEGALO_VERSIONS } from "../src/version";

const mcc = MEGALO_VERSIONS["107-mcc"];
const v107 = MEGALO_VERSIONS["107"];
const v106 = MEGALO_VERSIONS["106"];

const minimalScript = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
`;

const scriptWith = (body: string) => `${minimalScript}
trigger initialization
${body}
end
`;

const loc = (offset: number, line = 1, column = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: {
    localOffset: offset,
    absoluteOffset: offset,
    line,
    column,
  },
  end: {
    localOffset: offset + 1,
    absoluteOffset: offset + 1,
    line,
    column: column + 1,
  },
});

const emptyVariableMetadata = () => ({
  numericVariables: [],
  timerVariables: [],
  teamVariables: [],
  playerVariables: [],
  objectVariables: [],
});

const buildMinimalIr = (): IR => {
  const locations = createFieldLocations();
  const scriptStrings = new StringTable();
  const baseNameStringIndex = scriptStrings.addEntry({
    english: "Custom Game",
  });

  return {
    baseOverrides: {
      userDefinedOptions: [],
      playerTraits: [],
    },
    gameVariant: {
      baseVariant: {
        metadata: {
          general: { gameEngineType: 0, gameMode: 0 },
          creationHistory: {
            timestamp: new Date(),
            xuid: BigInt(0),
            name: "Default",
            isOnline: false,
          },
          modificationHistory: {
            timestamp: new Date(),
            xuid: BigInt(0),
            name: "Default",
            isOnline: false,
          },
        },
        builtIn: false,
        miscellaneousOptions: {},
        respawnOptions: {},
        socialOptions: {},
        mapOverrideOptions: {},
        teamOptions: {},
        loadoutTraits: {},
      },
      playerTraits: [],
      userDefinedOptions: [],
      scriptStrings,
      baseNameStringIndex,
      engineIcon: undefined,
      engineCategory: undefined,
      baseVariantParametersLocked: {},
      baseVariantParametersHidden: {},
      gameEngine: {
        conditions: [],
        actions: [],
        triggers: [],
        statistics: [],
        variableMetadata: {
          global: emptyVariableMetadata(),
          player: emptyVariableMetadata(),
          object: emptyVariableMetadata(),
          team: emptyVariableMetadata(),
          temporary: emptyVariableMetadata(),
        },
        hudWidgets: [],
        initializationTriggerIndex: 0,
        localInitializationTriggerIndex: 0,
        hostMigrationTriggerIndex: 0,
        doubleMigrationTriggerIndex: 0,
        objectDeathEventTriggerIndex: 0,
        localTriggerIndex: 0,
        pregameTriggerIndex: 0,
        objectsUsed: [],
        objectFilters: [],
      },
      tu1Settings: {},
    },
    locations,
  };
};

class TestCompiler106 extends Compiler {
  dryRun() {
    return { metadata: {} };
  }
  writeMegaloFile() {
    return {
      data: new Uint8Array(),
      metadata: {},
      variantByteLength: 0,
    };
  }
  getCapabilities() {
    return CAPABILITES_106;
  }
  getMegaloVersion() {
    return v106;
  }
}

describe("107 / 106 smoke compile", () => {
  it.each([
    ["107", v107],
    ["106", v106],
  ] as const)("compiles a minimal script on %s", async (_id, version) => {
    const result = await compileSource(minimalScript, { version });
    expect(
      result.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error)
    ).toEqual([]);
    expect(result.bytes).toBeDefined();
    expect(result.bytes!.length).toBeGreaterThan(0);
  });
});

describe("MCC-only action / math gates", () => {
  it("rejects hide_object on 107 and 106, accepts on 107-mcc", async () => {
    const source = scriptWith("\taction hide_object none true\n");

    const mccResult = await compileSource(source, { version: mcc });
    expect(
      mccResult.diagnostics.some((d) => d.message.includes("not supported"))
    ).toBe(false);

    for (const version of [v107, v106]) {
      const result = await compileSource(source, { version });
      expect(
        result.diagnostics.some((d) =>
          d.message.includes(
            `Action 'hide_object' is not supported by ${getLabel(version)}`
          )
        )
      ).toBe(true);
      expect(result.bytes).toBeUndefined();
    }
  });

  it("rejects << on 107 and 106, accepts on 107-mcc", async () => {
    const source = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
variables global
\tlocal number n 0
end
trigger initialization
\taction set n << 1
end
`;

    const mccResult = await compileSource(source, { version: mcc });
    expect(
      mccResult.diagnostics.some((d) =>
        d.message.toLowerCase().includes("not supported")
      )
    ).toBe(false);
    expect(mccResult.bytes).toBeDefined();

    for (const version of [v107, v106]) {
      const result = await compileSource(source, { version });
      expect(
        result.diagnostics.some((d) =>
          d.message.includes(
            `Math operation '<<' is not supported by ${getLabel(version)}`
          )
        )
      ).toBe(true);
      expect(result.bytes).toBeUndefined();
    }
  });
});

describe("temporary spill on 107 / 106", () => {
  it.each([
    ["107", v107],
    ["106", v106],
  ] as const)("spills temps to globals on %s even when overflow setting is false", (_id, version) => {
    const frontend = new MegaloCompilerContext(version, undefined, {
      temporaryVariablesCanOverflowIntoUnusedGlobalVariables: false,
    });
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(frontend, diagnostics);

    const id = binder.addVariable({
      name: "t0",
      type: VariableType.Number,
      declaration: loc(0),
      scope: VariableScope.Temporary,
    });
    binder.setScopeEnd(id, {
      localOffset: 100,
      absoluteOffset: 100,
      line: 1,
      column: 1,
    });

    const slots = buildVariableSlotMap(
      frontend,
      binder.getSymbolTable(),
      diagnostics
    );

    expect(diagnostics.hasErrors()).toBe(false);
    expect(slots.get(id)?.scope).toBe(VariableScope.Global);
    expect(slots.get(id)?.index).toBe(0);
  });
});

describe("TU1 options on 106 vs 107", () => {
  it("rejects tu1_* override on 106 and accepts on 107", async () => {
    const source = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
game_options
\toverride tu1_magnum_damage_multiplier 1.25
end
`;

    const on107 = await compileSource(source, { version: v107 });
    expect(
      on107.diagnostics.some((d) =>
        d.message.includes("tu1_magnum_damage_multiplier")
      )
    ).toBe(false);
    expect(on107.bytes).toBeDefined();

    const on106 = await compileSource(source, { version: v106 });
    expect(
      on106.diagnostics.some((d) =>
        d.message.includes("tu1_magnum_damage_multiplier")
      )
    ).toBe(true);
    expect(on106.bytes).toBeUndefined();
  });

  it("assertCompatibleIR rejects tu1Settings leaves on 106", () => {
    const ir = buildMinimalIr();
    ir.gameVariant.tu1Settings = { magnumDamage: 1.25 };
    ir.locations.record(ir.gameVariant.tu1Settings, "magnumDamage", loc(7));

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, new TestCompiler106(), diagnostics);

    const errors = diagnostics.getErrors();
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]?.message).toContain("magnumDamage");
    expect(errors[0]?.message).toContain(getLabel(v106));
  });
});

describe("actionType / mathOperation version gates", () => {
  it("omits MCC-only actions on retail 107 and 106", () => {
    for (const version of [v107, v106]) {
      const members = actionType.supportedMembers(version);
      expect(members.has("hide_object")).toBe(false);
      expect(members.has("begin")).toBe(false);
      expect(members.has("get_button_time")).toBe(false);
      expect(members.has("end_round")).toBe(true);
    }
    expect(actionType.supportedMembers(mcc).has("hide_object")).toBe(true);
    expect(actionType.supportedMembers(mcc).has("begin")).toBe(true);
  });

  it("omits lshift / rshift on retail 107 and 106", () => {
    for (const version of [v107, v106]) {
      const members = mathOperation.supportedMembers(version);
      expect(members.has("lshift")).toBe(false);
      expect(members.has("rshift")).toBe(false);
      expect(members.has("set_to")).toBe(true);
    }
    expect(mathOperation.supportedMembers(mcc).has("lshift")).toBe(true);
    expect(mathOperation.supportedMembers(mcc).has("rshift")).toBe(true);
  });
});
