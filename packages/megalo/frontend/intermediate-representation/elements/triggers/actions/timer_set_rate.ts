import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  GameEngineTimerRate,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveCustomTimerReference } from "../../../parameters";
import { requireParamCount } from "../helpers";

const parseTimerRate = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): GameEngineTimerRate => {
  if (
    node.kind !== SyntaxKind.INTEGER &&
    node.kind !== SyntaxKind.FLOATING_POINT
  ) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("timer rate", ""),
      node.location ?? location,
    );
  }
  const value = Math.trunc(node.value);
  if (value < 0 || value > GameEngineTimerRate.Positive_1000x) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("timer rate", String(value)),
      node.location,
    );
  }
  return value as GameEngineTimerRate;
};

export const lowerTimerSetRate = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.TimerSetRate,
    parameters: {
      timer: resolveCustomTimerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      rate: parseTimerRate(parameters[1]!, location),
    },
  };
};
