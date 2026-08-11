import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveObjectReference } from "../../../parameters";
import { hasOptionalKeyword } from "../helpers";

export const lowerObjectDestroy = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 1 || parameters.length > 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(1, parameters.length),
      location,
    );
  }
  return {
    type: ActionType.ObjectDestroy,
    parameters: {
      object: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      noStatistics: hasOptionalKeyword(parameters, "no_statistics"),
    },
  };
};
