import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolvePlayerReference } from "../../../parameters";
import { lowerDynamicString } from "../dynamicString";

export const lowerPlayerSetObjectiveAllegiance = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),

      location,
    );
  }

  return {
    type: ActionType.PlayerSetObjectiveAllegiance,

    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      allegiance: lowerDynamicString(parameters[1]!, ctx),
    },
  };
};
