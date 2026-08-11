import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  NavpointPriority,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveObjectReference } from "../../../parameters";
import { requireKeyword, requireParamCount } from "../helpers";

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
