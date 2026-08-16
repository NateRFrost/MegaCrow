import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritableNumeric } from "src/frontend/intermediate-representation/diagnostics";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
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

export const lowerObjectGetDistance = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);

  const paramCtx = asParameterLoweringContext(ctx);
  const __writableOut = resolveCustomVariableReference(
    parameters[2]!,
    paramCtx
  );
  assertWritableNumeric(__writableOut, parameters[2]!.location);

  return {
    type: ActionType.object_get_distance,

    parameters: {
      from: resolveObjectReference(parameters[0]!, paramCtx),

      to: resolveObjectReference(parameters[1]!, paramCtx),

      distanceOut: __writableOut,
    },
  };
};
