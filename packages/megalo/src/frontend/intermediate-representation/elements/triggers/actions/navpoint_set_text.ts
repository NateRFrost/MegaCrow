import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
