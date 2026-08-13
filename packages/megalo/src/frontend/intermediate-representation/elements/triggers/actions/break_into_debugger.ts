import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "../../../parameters/context";
import { requireParamCount } from "../helpers";

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
