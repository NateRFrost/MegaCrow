import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { CustomGameEngineDefinition } from "src/frontend/intermediate-representation/game/game_variant";
import {
  type Trigger,
  TriggerExecutionMode,
  TriggerType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";
import { TRIGGER_EXECUTION_KINDS } from "src/frontend/language-configuration/omni/triggers";
import { SymbolKind, type SymbolTable } from "src/frontend/symbol-table";

export interface TriggerHeaderInfo {
  executionMode: TriggerExecutionMode;
  objectFilterIndex?: number;
  /** Special engine index field to update, if any. */
  specialIndexKey?: keyof Pick<
    CustomGameEngineDefinition,
    | "initializationTriggerIndex"
    | "localInitializationTriggerIndex"
    | "hostMigrationTriggerIndex"
    | "doubleMigrationTriggerIndex"
    | "objectDeathEventTriggerIndex"
    | "localTriggerIndex"
    | "pregameTriggerIndex"
  >;
  triggerType: TriggerType;
}

const SPECIAL_TRIGGER_TYPES: Record<
  string,
  {
    triggerType: TriggerType;
    specialIndexKey: NonNullable<TriggerHeaderInfo["specialIndexKey"]>;
  }
> = {
  initialization: {
    triggerType: TriggerType.Initialization,
    specialIndexKey: "initializationTriggerIndex",
  },
  local_initialization: {
    triggerType: TriggerType.LocalInitialization,
    specialIndexKey: "localInitializationTriggerIndex",
  },
  host_migration: {
    triggerType: TriggerType.HostMigration,
    specialIndexKey: "hostMigrationTriggerIndex",
  },
  double_migration: {
    // Same trigger type slot as host migration in some builds; MegaCrow tracks a
    // dedicated index field matching managedmegalo's double_migration name.
    triggerType: TriggerType.HostMigration,
    specialIndexKey: "doubleMigrationTriggerIndex",
  },
  object_death: {
    triggerType: TriggerType.ObjectDeath,
    specialIndexKey: "objectDeathEventTriggerIndex",
  },
  local: {
    triggerType: TriggerType.Local,
    specialIndexKey: "localTriggerIndex",
  },
  pregame: {
    triggerType: TriggerType.Pregame,
    specialIndexKey: "pregameTriggerIndex",
  },
};

const EXECUTION_MODES: Record<string, TriggerExecutionMode> = {
  general: TriggerExecutionMode.General,
  player: TriggerExecutionMode.Player,
  random_player: TriggerExecutionMode.RandomPlayer,
  team: TriggerExecutionMode.Team,
  object: TriggerExecutionMode.Object,
};

export const resolveTriggerHeader = (
  name: string,
  location: SourceCodeLocation,
  symbolTable: SymbolTable,
  objectFilterSymbolId: number | undefined,
  isInnerLoop: boolean
): TriggerHeaderInfo => {
  const lower = name.toLowerCase();

  if (isInnerLoop) {
    // for_each nested trigger is always a subroutine.
    if (objectFilterSymbolId !== undefined) {
      const symbol = symbolTable.getSymbol(objectFilterSymbolId);
      if (symbol?.kind !== SymbolKind.ObjectFilter) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("object filter", name),
          location
        );
      }
      return {
        executionMode: TriggerExecutionMode.ObjectWithLabel,
        triggerType: TriggerType.Subroutine,
        objectFilterIndex: symbol.index,
      };
    }

    const mode = EXECUTION_MODES[lower];
    if (mode !== undefined) {
      return {
        executionMode: mode,
        triggerType: TriggerType.Subroutine,
      };
    }

    throw new LowerError(
      diagnosticMessages.expectedOneOf(
        [...TRIGGER_EXECUTION_KINDS, "object filter name"],
        name
      ),
      location
    );
  }

  const special = SPECIAL_TRIGGER_TYPES[lower];
  if (special !== undefined) {
    return {
      executionMode: TriggerExecutionMode.General,
      triggerType: special.triggerType,
      specialIndexKey: special.specialIndexKey,
    };
  }

  const mode = EXECUTION_MODES[lower];
  if (mode !== undefined) {
    return {
      executionMode: mode,
      triggerType: TriggerType.Normal,
    };
  }

  // Named object filter → object_with_label
  if (objectFilterSymbolId !== undefined) {
    const symbol = symbolTable.getSymbol(objectFilterSymbolId);
    if (symbol?.kind === SymbolKind.ObjectFilter) {
      return {
        executionMode: TriggerExecutionMode.ObjectWithLabel,
        triggerType: TriggerType.Normal,
        objectFilterIndex: symbol.index,
      };
    }
  }

  throw new LowerError(
    diagnosticMessages.expectedOneOf(
      [...TRIGGER_EXECUTION_KINDS, "object filter name"],
      name
    ),
    location
  );
};

export const applySpecialTriggerIndex = (
  engine: CustomGameEngineDefinition,
  header: TriggerHeaderInfo,
  triggerIndex: number
): void => {
  if (header.specialIndexKey !== undefined) {
    engine[header.specialIndexKey] = triggerIndex;
  }
};

export const makeTrigger = (
  header: TriggerHeaderInfo,
  window: {
    firstCondition: number;
    conditionCount: number;
    firstAction: number;
    actionCount: number;
  }
): Trigger => ({
  executionMode: header.executionMode,
  triggerType: header.triggerType,
  objectFilterIndex: header.objectFilterIndex,
  firstCondition: window.firstCondition,
  conditionCount: window.conditionCount,
  firstAction: window.firstAction,
  actionCount: window.actionCount,
});
