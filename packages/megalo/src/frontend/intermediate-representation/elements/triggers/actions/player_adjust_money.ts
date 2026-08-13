import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import { parseMathOperation, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

export const lowerPlayerAdjustMoney = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.PlayerAdjustMoney,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      operation: parseMathOperation(parameters[1]!, location),
      amount: resolveCustomVariableReference(parameters[2]!, paramCtx),
    },
  };
};
