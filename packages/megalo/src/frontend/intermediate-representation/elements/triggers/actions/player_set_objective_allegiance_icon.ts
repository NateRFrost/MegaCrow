import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
  lowerConstantInteger,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";

export const lowerPlayerSetObjectiveAllegianceIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const iconIndex = lowerConstantInteger(
    parameters[1]!,
    paramCtx,
    "constant integer",
    location
  ).value;
  if (iconIndex !== -1 && (iconIndex < 0 || iconIndex >= 128)) {
    throw new LowerError(
      diagnosticMessages.iconIndexOutOfRange(),
      parameters[1]?.location ?? location
    );
  }
  return {
    type: ActionType.player_set_objective_allegiance_icon,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      iconIndex,
    },
  };
};
