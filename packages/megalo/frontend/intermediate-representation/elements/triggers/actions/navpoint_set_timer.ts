import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { CustomTimerType } from "../../../game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomTimerReference,
  resolveObjectReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

const timerIndexFromParameter = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
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
