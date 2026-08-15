import type { MegaloCompilerContext } from "src/context";
import type { Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import type {
  LoadoutPaletteTraits,
  LoadoutTraits,
  MultiplayerTeamDesignator,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import type { CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { MegaloVariableNetworkState } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type { VariableSlotMap } from "src/frontend/intermediate-representation/preprocessing/symbols";
import type { SymbolId, SymbolTable } from "src/frontend/symbol-table";

export interface VariableDeclarationInfo {
  networkState: MegaloVariableNetworkState;
  initial?: CustomVariableReference;
  initialTeam?: MultiplayerTeamDesignator;
}

export interface ElementLowerContext {
  readonly diagnostics: Diagnostics;
  readonly frontend: MegaloCompilerContext;
  // True while lowering a pregame trigger or a trigger nested within a pregame trigger.
  inPregameTrigger: boolean;
  readonly ir: IR;
  readonly loadoutPalettesByName: Map<string, LoadoutPaletteTraits>;
  readonly loadoutsByName: Map<string, LoadoutTraits>;
  readonly symbolTable: SymbolTable;
  readonly variableDeclarations: Map<SymbolId, VariableDeclarationInfo>;
  readonly variableSlots: VariableSlotMap;
}

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
