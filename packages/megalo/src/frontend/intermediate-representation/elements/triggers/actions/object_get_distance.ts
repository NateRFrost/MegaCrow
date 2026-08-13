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

export const lowerObjectGetDistance = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);

  const paramCtx = asParameterLoweringContext(ctx);

  return {
    type: ActionType.ObjectGetDistance,

    parameters: {
      from: resolveObjectReference(parameters[0]!, paramCtx),

      to: resolveObjectReference(parameters[1]!, paramCtx),

      distanceOut: resolveCustomVariableReference(parameters[2]!, paramCtx),
    },
  };
};
