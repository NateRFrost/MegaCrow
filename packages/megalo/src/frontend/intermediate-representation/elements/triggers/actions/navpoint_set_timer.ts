import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { CustomTimerType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveCustomTimerReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

const timerIndexFromParameter = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  if (
    (node.kind === SyntaxKind.KEYWORD || node.kind === SyntaxKind.REFERENCE) &&
    (node.kind === SyntaxKind.KEYWORD ? node.value : node.identifier) === "none"
  ) {
    return -1;
  }
  const timer = resolveCustomTimerReference(
    node,
    asParameterLoweringContext(ctx),
  );
  if (
    timer.type === CustomTimerType.Global ||
    timer.type === CustomTimerType.Player ||
    timer.type === CustomTimerType.Team ||
    timer.type === CustomTimerType.Object
  ) {
    return timer.variableIndex;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("timer", ""),
    node.location ?? location,
  );
};

export const lowerNavpointSetTimer = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.NavpointSetTimer,
    parameters: {
      navpoint: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      timerIndex: timerIndexFromParameter(parameters[1]!, ctx, location),
    },
  };
};
