import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

export const lowerBreakIntoDebugger = (
  parameters: ASTParameterNode[],
  _ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 0, location);
  return {
    type: ActionType.BreakIntoDebugger,
    parameters: undefined as never,
  };
};
