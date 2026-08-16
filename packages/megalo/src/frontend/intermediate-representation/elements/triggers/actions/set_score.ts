import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  parseMathOperation,
  parseTeamOrPlayerTarget,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveCustomVariableReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerSetScore = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  const { target, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    2,
    ctx,
    location
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location
    );
  }

  return {
    type: ActionType.set_score,
    parameters: {
      operation: parseMathOperation(parameters[0]!, location, ctx),
      variable: resolveCustomVariableReference(parameters[1]!, paramCtx),
      target,
    },
  };
};
