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
import { resolveCustomVariableReference } from "src/frontend/intermediate-representation/parameters";
import { parseTeamOrPlayerTarget, parseMathOperation } from "src/frontend/intermediate-representation/elements/triggers/helpers";

export const lowerSetScore = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location,
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  const { target, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    2,
    ctx,
    location,
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location,
    );
  }

  return {
    type: ActionType.SetScore,
    parameters: {
      operation: parseMathOperation(parameters[0]!, location),
      variable: resolveCustomVariableReference(parameters[1]!, paramCtx),
      target,
    },
  };
};
