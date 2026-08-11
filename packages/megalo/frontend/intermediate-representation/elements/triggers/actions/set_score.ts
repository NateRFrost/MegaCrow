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
import { resolveCustomVariableReference } from "../../../parameters";
import { parseTeamOrPlayerTarget, parseMathOperation } from "../helpers";

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
