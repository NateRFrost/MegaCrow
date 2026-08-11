import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
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
  resolveObjectReference,
} from "../../../parameters";
import { parseMathOperation, requireParamCount } from "../helpers";

const lowerVitalityAdjustment = (
  type:
    | ActionType.ObjectAdjustShield
    | ActionType.ObjectAdjustHealth
    | ActionType.ObjectAdjustMaximumShield
    | ActionType.ObjectAdjustMaximumHealth,
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      operation: parseMathOperation(parameters[1]!, location),
      amount: resolveCustomVariableReference(parameters[2]!, paramCtx),
    },
  };
};

export const lowerObjectAdjustHealth = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action =>
  lowerVitalityAdjustment(
    ActionType.ObjectAdjustHealth,
    parameters,
    ctx,
    location,
  );
