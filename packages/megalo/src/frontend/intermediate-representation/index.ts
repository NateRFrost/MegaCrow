import type { AST } from "../abstract-syntax-tree";
import { ElementKind } from "../abstract-syntax-tree/elements";
import type { MegaloCompilerContext } from "../../context";
import { type Diagnostics, type SourceLocation } from "../../diagnostics";
import type { ObjectLists } from "../object-lists";
import { assertAllowedInBaseDerived } from "./diagnostics/assertAllowedInBaseDerived";
import { dxAssertionScope } from "./diagnostics";
import { ELEMENT_LOWERERS, baseLowerer } from "./elements";
import type { ElementLowerContext } from "./parameters";
import type { GameEngineCustomVariant } from "./game/game_variant";
import { StringTable } from "./game/string_table";
import type { VariableMetadata } from "./game/megalogamengine/megalogamengine_variable_metadata";
import type {
  PlayerTraitOptionOverride,
  UserDefinedOptionOverride,
} from "./game/megalogamengine/megalogamengine_user_defined_options";
import {
  createFieldLocations,
  type FieldLocations,
} from "./locations";
import { applyDefaultLoadoutCameraTime } from "./postprocessing/applyDefaultLoadoutCameraTime";
import { applyMetadata } from "./postprocessing/applyMetadata";
import { applyVariableMetadata } from "./postprocessing/applyVariableMetadata";
import { buildVariableSlotMap } from "./preprocessing/symbols";

export type Located<T> = {
  value: T;
  location: SourceLocation;
};

export type IR = {
  // We use this more as a presence indicator for whether a file is base-derived,
  // Its possible we cant find the file, in which case baseFileBytes isnt set,
  // but the file is still base derived and we wanna know about that.
  baseFilePath?: string;
  // Raw bytes of the base .mglo file.
  baseFileBytes?: Uint8Array;
  // Anything applied on top of a base file that doesnt fit within the typical
  // GameEngineCustomVariant struct.
  baseOverrides: BaseOverrides;
  gameVariant: GameEngineCustomVariant;
  /** Source locations for IR leaves (diagnostics / unused-override warnings). */
  locations: FieldLocations;
};

export type BaseOverrides = {
  userDefinedOptions: UserDefinedOptionOverride[];
  playerTraits: PlayerTraitOptionOverride[];
};

export type { PlayerTraitOptionOverride, UserDefinedOptionOverride };

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
  public constructor(private readonly frontend: MegaloCompilerContext) {}

  public lower(
    ast: AST,
    diagnostics: Diagnostics,
    context: LowerContext = {}
  ): IR {
    const ir = this.buildDefaultIR();
    if (this.frontend.megacrowExtensions.notBuiltIn) {
      ir.gameVariant.baseVariant.builtIn = false;
    }
    const lowerContext: ElementLowerContext = {
      frontend: this.frontend,
      symbolTable: ast.symbolTable,
      variableSlots: buildVariableSlotMap(
        this.frontend,
        ast.symbolTable,
        diagnostics
      ),
      ir,
      diagnostics,
      loadoutsByName: new Map(),
      loadoutPalettesByName: new Map(),
      variableDeclarations: new Map(),
      inPregameTrigger: false,
    };

    // Base element always goes first.
    for (const element of ast.elements) {
      if (element.elementKind !== ElementKind.BASE) {
        continue;
      }
      baseLowerer(element, lowerContext);
    }

    for (const element of ast.elements) {
      if (element.elementKind === ElementKind.BASE) {
        continue;
      }
      dxAssertionScope(diagnostics, () => {
        assertAllowedInBaseDerived(element, lowerContext);
        const elementLowerer = ELEMENT_LOWERERS.get(element.elementKind);
        if (elementLowerer) {
          elementLowerer(element, lowerContext);
        } else {
          console.warn(`lowerer for ${element.elementKind} NYI`);
        }
      });
    }

    this.postprocess(ir, lowerContext, context);

    return ir;
  }

  private postprocess(
    ir: IR,
    ctx: ElementLowerContext,
    _lowerCtx: LowerContext
  ) {
    applyDefaultLoadoutCameraTime(ir);
    applyMetadata(ir);
    applyVariableMetadata(ir, ctx);
  }

  private buildDefaultIR(): IR {
    const scriptStrings = new StringTable();

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
        builtIn: true,
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
      baseNameStringIndex: 0,
      localizedName: undefined,
      localizedDescription: undefined,
      localizedCategory: undefined,
      engineIcon: undefined,
      engineCategory: undefined,
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

    return {
      baseFilePath: undefined,
      baseOverrides: {
        userDefinedOptions: [],
        playerTraits: [],
      },
      gameVariant,
      locations,
    };
  }
}

export type { FieldLocations } from "./locations";
export { createFieldLocations } from "./locations";
export { setField } from "./setField";
