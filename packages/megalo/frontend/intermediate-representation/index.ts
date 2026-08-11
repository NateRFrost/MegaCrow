import type { AST } from "../abstract-syntax-tree";
import {
  BUILT_IN_LOCATION,
  type Diagnostics,
  type SourceLocation,
} from "../diagnostics";
import type { ObjectLists } from "../object-lists";
import type { VersionConfiguration } from "../version-configuration";
import { ELEMENT_LOWERERS } from "./elements";
import type { ElementLowerContext } from "./parameters";
import type { GameEngineCustomVariant } from "./game/game_variant";
import { StringTable } from "./game/string_table";
import type { VariableMetadata } from "./game/megalogamengine/megalogamengine_variable_metadata";
import {
  createFieldLocations,
  type FieldLocations,
} from "./locations";
import { applyBaseName } from "./postprocessing/applyBaseName";
import { applyDefaultLoadoutCameraTime } from "./postprocessing/applyDefaultLoadoutCameraTime";
import { applyMetadata } from "./postprocessing/applyMetadata";
import { applyVariableMetadata } from "./postprocessing/applyVariableMetadata";
import { buildVariableSlotMap } from "./preprocessing/symbols";


export type Located<T> = {
  value: T;
  location: SourceLocation;
};

export type IR = {
  baseFilePath?: string;
  baseFileBytes?: Uint8Array;
  gameVariant: GameEngineCustomVariant;
  locations: FieldLocations;
};

export type LowerContext = {
  objectLists?: ObjectLists;
};

export const located = <T>(
  value: T,
  location: SourceLocation
): Located<T> => ({ value, location });

const emptyVariableMetadata = (): VariableMetadata => ({
  numericVariables: [],
  timerVariables: [],
  teamVariables: [],
  playerVariables: [],
  objectVariables: [],
});

export class Lowerer {
  private readonly versionConfiguration: VersionConfiguration;
  public constructor(versionConfiguration: VersionConfiguration) {
    this.versionConfiguration = versionConfiguration;
  }

  public lower(
    ast: AST,
    diagnostics: Diagnostics,
    context: LowerContext = {}
  ): IR {
    void context;

    const ir = this.buildDefaultIR();
    const lowerContext: ElementLowerContext = {
      symbolTable: ast.symbolTable,
      variableSlots: buildVariableSlotMap(
        ast.symbolTable,
        this.versionConfiguration.limits,
        diagnostics
      ),
      ir,
      diagnostics,
      loadoutsByName: new Map(),
      loadoutPalettesByName: new Map(),
      variableDeclarations: new Map(),
    };

    ast.elements.forEach((element) => {
      const elementLowerer = ELEMENT_LOWERERS.get(element.elementKind);
      if (elementLowerer) {
        elementLowerer(element, lowerContext);
      } else {
        console.warn(`lowerer for ${element.elementKind} NYI`);
      }
    });

    this.postprocess(ir, lowerContext);

    return ir;
  }

  private postprocess(ir: IR, ctx: ElementLowerContext) {
    applyDefaultLoadoutCameraTime(ir);
    applyBaseName(ir);
    applyMetadata(ir);
    applyVariableMetadata(ir, ctx);
  }

  private buildDefaultIR(): IR {
    const scriptStrings = new StringTable();
    const defaultNameIndex = scriptStrings.addEntry({
      english: "Custom Game",
    });

    const locations = createFieldLocations();
    const gameVariant: GameEngineCustomVariant = {
      baseVariant: {
        metadata: {
          general: {
            gameEngineType: 0,
            gameMode: 0,
          },
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
      baseNameStringIndex: defaultNameIndex,
      localizedName: undefined,
      localizedDescription: undefined,
      localizedCategory: undefined,
      engineIcon: 0,
      engineCategory: 0,
      mapPermissions: undefined,
      playerRatings: undefined,
      scoreToWinRound: undefined,
      fireTeamsEnabled: undefined,
      symmetricGametype: undefined,
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
        initializationTriggerIndex: -1,
        localInitializationTriggerIndex: -1,
        hostMigrationTriggerIndex: -1,
        doubleMigrationTriggerIndex: -1,
        objectDeathEventTriggerIndex: -1,
        localTriggerIndex: -1,
        pregameTriggerIndex: -1,
        objectsUsed: [],
        objectFilters: [],
      },
      tu1Settings: {},
    };

    locations.record(gameVariant, "engineIcon", BUILT_IN_LOCATION);
    locations.record(gameVariant, "engineCategory", BUILT_IN_LOCATION);

    return {
      baseFilePath: undefined,
      gameVariant,
      locations,
    };
  }
}

export type { FieldLocations } from "./locations";
export { createFieldLocations } from "./locations";
export { setField } from "./setField";

