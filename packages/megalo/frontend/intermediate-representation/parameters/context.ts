import type { Diagnostics } from "../../diagnostics";
import type { SymbolId, SymbolTable } from "../../symbol-table";
import type { VariableSlotMap } from "../preprocessing/symbols";
import type { IR } from "..";
import type {
  LoadoutPaletteTraits,
  LoadoutTraits,
} from "../game/game_engine_default";
import type { CustomVariableReference } from "../game/megalogamengine/megalogamengine_references";
import type { MegaloVariableNetworkState } from "../game/megalogamengine/megalogamengine_variable_metadata";

export type VariableDeclarationInfo = {
  networkState: MegaloVariableNetworkState;
  initial: CustomVariableReference;
};

/**
 * Context shared by every IR element lowerer.
 */
export type ElementLowerContext = {
  readonly symbolTable: SymbolTable;
  readonly variableSlots: VariableSlotMap;
  readonly ir: IR;
  readonly diagnostics: Diagnostics;
  /** Lowered declarations available to dependent element passes. */
  readonly loadoutsByName: Map<string, LoadoutTraits>;
  readonly loadoutPalettesByName: Map<string, LoadoutPaletteTraits>;
  /** Declared variables' network state + initial value, keyed by symbol id. */
  readonly variableDeclarations: Map<SymbolId, VariableDeclarationInfo>;
};

/**
 * Context for parameter lowering (triggers, trait options, etc.).
 * Option/stat maps are filled by the caller from earlier element passes.
 */
export type ParameterLoweringContext = ElementLowerContext & {
  /** Trigger execution mode, used to disambiguate bare temporary_N compiled names. */
  readonly triggerExecutionMode?:
    | "player"
    | "team"
    | "object"
    | "global"
    | string;
  readonly optionIndexByName: ReadonlyMap<string, number>;
  readonly statIndexByName: ReadonlyMap<string, number>;
};

/** Lift an element context into a parameter context with empty option/stat maps. */
export const asParameterLoweringContext = (
  ctx: ElementLowerContext,
  extras?: Partial<
    Pick<
      ParameterLoweringContext,
      "triggerExecutionMode" | "optionIndexByName" | "statIndexByName"
    >
  >
): ParameterLoweringContext => ({
  ...ctx,
  optionIndexByName: extras?.optionIndexByName ?? new Map(),
  statIndexByName: extras?.statIndexByName ?? new Map(),
  triggerExecutionMode: extras?.triggerExecutionMode,
});
