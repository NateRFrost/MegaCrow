import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  NavpointPriority,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import { requireKeyword, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

const NAVPOINT_PRIORITY_BY_NAME: Record<string, NavpointPriority> = {
  low: NavpointPriority.Low,
  normal: NavpointPriority.Normal,
  high: NavpointPriority.High,
  blink: NavpointPriority.Blink,
};

export const lowerNavpointSetPriority = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  const priorityName = requireKeyword(parameters[1]!, location).toLowerCase();
  const priority = NAVPOINT_PRIORITY_BY_NAME[priorityName];
  if (priority === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "navpoint priority",
        priorityName,
      ),
      parameters[1]!.location,
    );
  }
  return {
    type: ActionType.NavpointSetPriority,
    parameters: {
      navpoint: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      priority,
    },
  };
};
