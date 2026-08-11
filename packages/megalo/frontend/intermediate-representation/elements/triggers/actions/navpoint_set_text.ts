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
import { lowerDynamicString } from "../dynamicString";
import { requireParamCount } from "../helpers";

export const lowerNavpointSetText = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.NavpointSetText,

    parameters: {
      object: resolveObjectReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      string: lowerDynamicString(parameters[1]!, ctx),
    },
  };
};
