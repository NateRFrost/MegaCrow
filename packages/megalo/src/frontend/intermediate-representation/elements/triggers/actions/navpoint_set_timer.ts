import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { CustomTimerType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  resolveCustomTimerReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const timerIndexFromParameter = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (
    (node.kind === SyntaxKind.KEYWORD || node.kind === SyntaxKind.REFERENCE) &&
    (node.kind === SyntaxKind.KEYWORD ? node.value : node.identifier) === "none"
  ) {
    return -1;
  }
  const timer = resolveCustomTimerReference(
    node,
    asParameterLoweringContext(ctx)
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
    node.location ?? location
  );
};

export const lowerNavpointSetTimer = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.navpoint_set_timer,
    parameters: {
      navpoint: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      timerIndex: timerIndexFromParameter(parameters[1]!, ctx, location),
    },
  };
};
