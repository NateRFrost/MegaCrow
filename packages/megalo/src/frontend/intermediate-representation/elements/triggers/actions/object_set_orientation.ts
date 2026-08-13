import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import { hasOptionalKeyword } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
