import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolvePlayerReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerPlayerSetObjectiveAllegiance = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),

      location
    );
  }

  return {
    type: ActionType.PlayerSetObjectiveAllegiance,

    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,

        asParameterLoweringContext(ctx)
      ),

      allegiance: lowerDynamicString(parameters[1]!, ctx),
    },
  };
};
