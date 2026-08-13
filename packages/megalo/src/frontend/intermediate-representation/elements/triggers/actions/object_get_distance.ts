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
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
