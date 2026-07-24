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
import { applyBaseName } from "./postprocessing/applyBaseName";
import { applyDefaultLoadoutCameraTime } from "./postprocessing/applyDefaultLoadoutCameraTime";
import { applyMetadata } from "./postprocessing/applyMetadata";
import { applyVariableMetadata } from "./postprocessing/applyVariableMetadata";
import { buildVariableSlotMap } from "./preprocessing/symbols";

export type ValueWithLocation<T> = {
  value: T;
  location: SourceLocation;
};

export type IR = {
  baseFilePath?: string;
  gameVariant: GameEngineCustomVariant;
};

export type LowerContext = {
  objectLists?: ObjectLists;
};

export const valueWithLocation = <T>(
  value: T,
  location: SourceLocation
): ValueWithLocation<T> => ({ value, location });

export const getIRValue = <T>(
  value: ValueWithLocation<T> | undefined
): T | undefined => (value === undefined ? undefined : value.value);

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
      }
      else {
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

    const ir: IR = {
      baseFilePath: undefined,
      gameVariant: {
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
        engineIcon: valueWithLocation(0, BUILT_IN_LOCATION),
        engineCategory: valueWithLocation(0, BUILT_IN_LOCATION),
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
    };
    return ir;
  }
}
