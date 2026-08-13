import { describe, expect, it } from "vitest";
import { CAPABILITES_107_MCC } from "../../../../src/backend/compile/107-mcc/capabilities";
import { Compiler } from "../../../../src/backend/compile/compiler";
import { assertCompatibleIR } from "../../../../src/backend/compile/diagnostics/assertCompatibleIR";
import {
  Diagnostics,
  SourceLocationType,
  type SourceCodeLocation,
} from "../../../../src/diagnostics";
import {
  createFieldLocations,
  type IR,
} from "../../../../src/frontend/intermediate-representation";
import { emptyPlayerTraits } from "../../../../src/frontend/intermediate-representation/elements/game_options/shared";
import { StringTable } from "../../../../src/frontend/intermediate-representation/game/string_table";
import { getLabel, MEGALO_VERSIONS } from "../../../../src/version";

/** Minimal compiler stub — avoids pulling @blamnetwork/blf into this test. */
class TestCompiler extends Compiler {
  dryRun(): void {}
  writeMegaloFile(): Uint8Array {
    return new Uint8Array();
  }
  getCapabilities() {
    return CAPABILITES_107_MCC;
  }
  getMegaloVersion() {
    return MEGALO_VERSIONS["107-mcc"];
  }
}

const compiler = new TestCompiler();

const loc = (
  offset: number,
  line = 1,
  column = 1
): SourceCodeLocation => ({
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
  const baseNameStringIndex = scriptStrings.addEntry({ english: "Custom Game" });

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

describe("107-mcc field capabilities", () => {
  it("errors when an unsupported leaf is provided", () => {
    const ir = buildMinimalIr();
    const traits = emptyPlayerTraits();
    const sprintLoc = loc(42, 3, 4);
    traits.movement.sprinting = true;
    ir.locations.record(traits.movement, "sprinting", sprintLoc);
    ir.gameVariant.baseVariant.mapOverrideOptions.basePlayerTraits = traits;

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, compiler, diagnostics);

    const errors = diagnostics.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("sprinting");
    expect(errors[0]?.message).toContain(getLabel(MEGALO_VERSIONS["107-mcc"]));
    expect(errors[0]?.location).toEqual(sprintLoc);
  });

  it("accepts a supported provided leaf", () => {
    const ir = buildMinimalIr();
    const traits = emptyPlayerTraits();
    traits.movement.speedPercentage = 100;
    ir.locations.record(traits.movement, "speedPercentage", loc(1));
    ir.gameVariant.baseVariant.mapOverrideOptions.basePlayerTraits = traits;

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, compiler, diagnostics);
    expect(diagnostics.getErrors()).toEqual([]);
  });

  it("ignores unsupported fields that are absent", () => {
    const ir = buildMinimalIr();
    const traits = emptyPlayerTraits();
    ir.gameVariant.baseVariant.mapOverrideOptions.basePlayerTraits = traits;

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, compiler, diagnostics);
    expect(diagnostics.getErrors()).toEqual([]);
  });

  it("reports nested map-override trait paths", () => {
    const ir = buildMinimalIr();
    const traits = emptyPlayerTraits();
    const sprintLoc = loc(10, 2, 2);
    traits.movement.sprinting = true;
    ir.locations.record(traits.movement, "sprinting", sprintLoc);
    ir.gameVariant.baseVariant.mapOverrideOptions.basePlayerTraits = traits;

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, compiler, diagnostics);

    expect(diagnostics.getErrors()[0]?.message).toContain(
      "gameVariant.baseVariant.mapOverrideOptions.basePlayerTraits.movement.sprinting"
    );
    expect(diagnostics.getErrors()[0]?.location).toEqual(sprintLoc);
  });

  it("reports named player-trait option paths", () => {
    const ir = buildMinimalIr();
    const traits = emptyPlayerTraits();
    const sprintLoc = loc(99, 9, 9);
    traits.movement.sprinting = true;
    ir.locations.record(traits.movement, "sprinting", sprintLoc);
    ir.gameVariant.playerTraits.push({
      name: 0,
      description: 0,
      traits,
    });

    const diagnostics = new Diagnostics();
    assertCompatibleIR(ir, compiler, diagnostics);

    expect(diagnostics.getErrors()[0]?.message).toContain(
      "gameVariant.playerTraits[0].traits.movement.sprinting"
    );
    expect(diagnostics.getErrors()[0]?.location).toEqual(sprintLoc);
  });

});

