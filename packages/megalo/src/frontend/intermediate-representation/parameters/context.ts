import type { Diagnostics } from "../../../diagnostics";
import type { MegaloCompilerContext } from "../../../context";
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

export type ElementLowerContext = {
  readonly frontend: MegaloCompilerContext;
  readonly symbolTable: SymbolTable;
  readonly variableSlots: VariableSlotMap;
  readonly ir: IR;
  readonly diagnostics: Diagnostics;
  readonly loadoutsByName: Map<string, LoadoutTraits>;
  readonly loadoutPalettesByName: Map<string, LoadoutPaletteTraits>;
  readonly variableDeclarations: Map<SymbolId, VariableDeclarationInfo>;
  // True while lowering a pregame trigger or a trigger nested within a pregame trigger.
  inPregameTrigger: boolean;
};

export type ParameterLoweringContext = ElementLowerContext & {
  readonly triggerExecutionMode?:
    | "player"
    | "team"
    | "object"
    | "global"
    | string;
};

export const asParameterLoweringContext = (
  ctx: ElementLowerContext,
  extras?: Partial<Pick<ParameterLoweringContext, "triggerExecutionMode">>
): ParameterLoweringContext => ({
  ...ctx,
  triggerExecutionMode: extras?.triggerExecutionMode,
});
