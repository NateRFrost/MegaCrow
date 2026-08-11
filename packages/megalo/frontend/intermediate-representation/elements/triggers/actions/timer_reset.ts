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
import { resolveCustomTimerReference } from "../../../parameters";
import { requireParamCount } from "../helpers";

export const lowerTimerReset = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 1, location);
  return {
    type: ActionType.TimerReset,
    parameters: {
      timer: resolveCustomTimerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
    },
  };
};
