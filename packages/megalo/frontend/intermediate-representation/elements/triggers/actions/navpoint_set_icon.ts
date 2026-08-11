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
import { resolveObjectReference } from "../../../parameters";
import { parseIndexSuffix } from "../../../parameters/explicit";
import { requireKeyword } from "../helpers";

const NAVPOINT_ICON_BY_NAME: Record<string, number> = {
  none: 0,
  speaker: 1,
  attacker: 2,
  defender: 3,
  objective: 4,
  destination: 5,
  friend: 6,
  enemy: 7,
  pickup: 8,
  assault: 9,
  king: 10,
  invader: 11,
  vip: 12,
  defend: 13,
  recover: 13,
  neutralize: 13,
  num: 14,
};

const resolveNavpointIconIndex = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): number => {
  const name = requireKeyword(node, location).toLowerCase();
  const mapped = NAVPOINT_ICON_BY_NAME[name];
  if (mapped !== undefined) {
    return mapped;
  }
  const indexed = parseIndexSuffix(name, "navpoint_icon");
  if (indexed !== undefined) {
    return indexed;
  }
  const numeric = Number(name);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("navpoint icon", name),
    node.location,
  );
};

export const lowerNavpointSetIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.NavpointSetIcon,
    parameters: {
      navpoint: resolveObjectReference(parameters[0]!, paramCtx),
      icon: resolveNavpointIconIndex(parameters[1]!, location),
    },
  };
};
