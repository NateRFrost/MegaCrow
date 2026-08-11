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
import {
  resolveCustomTimerReference,
  resolveObjectReference,
} from "../../../parameters";
import { CustomTimerType } from "../../../game/megalogamengine/megalogamengine_references";
import { parsePlayerFilterModifier } from "../helpers";

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

export const lowerSetProgressBar = (
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
  const object = resolveObjectReference(
    parameters[0]!,
    asParameterLoweringContext(ctx),
  );
  const { filter, nextIndex } = parsePlayerFilterModifier(
    parameters,
    1,
    ctx,
    location,
  );
  const timerNode = parameters[nextIndex];
  if (timerNode === undefined || nextIndex + 1 !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        nextIndex + 1,
        parameters.length,
      ),
      location,
    );
  }
  return {
    type: ActionType.SetProgressBar,
    parameters: {
      object,
      playerFilterModifier: filter,
      timerIndex: timerIndexFromParameter(timerNode, ctx, location),
    },
  };
};
