import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "../../../parameters/context";
import { parseBooleanLiteral, requireParamCount } from "../helpers";

export const lowerDebuggingEnableTracing = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 1, location);
  return {
    type: ActionType.DebuggingEnableTracing,
    parameters: {
      tracingEnabled: parseBooleanLiteral(parameters[0]!, ctx, location),
    },
  };
};
