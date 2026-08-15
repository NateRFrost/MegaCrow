import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveCustomTimerReference } from "src/frontend/intermediate-representation/parameters";
import { lowerFloatParam } from "src/frontend/intermediate-representation/parameters/common";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerTimerSetRate = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const rate = lowerFloatParam(
    parameters[1]!,
    paramCtx,
    "timer rate",
    location
  );
  const action: Action = {
    type: ActionType.timer_set_rate,
    parameters: {
      timer: resolveCustomTimerReference(parameters[0]!, paramCtx),
      rate: rate.value,
    },
  };
  ctx.ir.locations.record(action.parameters, "rate", rate.location);
  return action;
};
