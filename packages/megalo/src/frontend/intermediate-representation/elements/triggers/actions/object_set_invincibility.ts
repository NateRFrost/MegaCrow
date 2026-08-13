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

export const lowerObjectSetInvincibility = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.ObjectSetInvincibility,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      invincible: resolveCustomVariableReference(parameters[1]!, paramCtx),
    },
  };
};
