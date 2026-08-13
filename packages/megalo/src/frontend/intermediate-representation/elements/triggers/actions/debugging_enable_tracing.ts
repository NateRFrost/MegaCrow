import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { parseBooleanLiteral, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
