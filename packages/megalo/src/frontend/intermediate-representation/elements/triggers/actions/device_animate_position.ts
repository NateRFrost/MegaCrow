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
  resolveObjectReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

export const lowerDeviceAnimatePosition = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 5, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.DeviceAnimatePosition,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      animationTargetFraction: resolveCustomVariableReference(
        parameters[1]!,
        paramCtx,
      ),
      animationDurationSeconds: resolveCustomVariableReference(
        parameters[2]!,
        paramCtx,
      ),
      accelerationSeconds: resolveCustomVariableReference(
        parameters[3]!,
        paramCtx,
      ),
      decelerationSeconds: resolveCustomVariableReference(
        parameters[4]!,
        paramCtx,
      ),
    },
  };
};
