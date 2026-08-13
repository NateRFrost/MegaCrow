import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "../../../parameters";
import { parseMathOperation, requireParamCount } from "../helpers";

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
