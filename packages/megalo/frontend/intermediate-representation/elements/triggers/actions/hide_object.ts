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
import { resolveObjectReference } from "../../../parameters";
import { parseBooleanLiteral, requireParamCount } from "../helpers";

export const lowerHideObject = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.HideObject,

    parameters: {
      object: resolveObjectReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      shouldHide: parseBooleanLiteral(parameters[1]!, location),
    },
  };
};
