import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  parseMathOperation,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const lowerVitalityAdjustment = (
  type:
    | typeof ActionType.object_adjust_shield
    | typeof ActionType.object_adjust_health
    | typeof ActionType.object_adjust_maximum_shield
    | typeof ActionType.object_adjust_maximum_health,
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
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

export const lowerObjectAdjustMaximumHealth = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action =>
  lowerVitalityAdjustment(
    ActionType.object_adjust_maximum_health,
    parameters,
    ctx,
    location
  );
