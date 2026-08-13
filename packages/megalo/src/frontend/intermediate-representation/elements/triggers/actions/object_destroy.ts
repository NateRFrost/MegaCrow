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
