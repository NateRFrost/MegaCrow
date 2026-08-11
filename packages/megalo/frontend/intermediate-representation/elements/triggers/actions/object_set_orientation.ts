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

export const lowerObjectSetOrientation = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.ObjectSetOrientation,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      source: resolveObjectReference(parameters[1]!, paramCtx),
      ...(hasOptionalKeyword(parameters, "absolute_orientation")
        ? { absoluteOrientation: true }
        : {}),
    },
  };
};
