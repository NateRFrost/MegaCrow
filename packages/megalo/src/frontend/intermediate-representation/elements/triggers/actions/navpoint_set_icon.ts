import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireKeyword } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const NAVPOINT_ICON_BY_NAME: Record<string, number> = {
  none: -1,
  speaker: 0,
  dead_teammate: 1,
  unused: 2,
  target: 3,
  destination: 4,
  bomb: 5,
  flag: 6,
  skull: 7,
  king: 8,
  vip: 9,
  lock: 10,
  num: 11, // uses custom number variable
  // 12-19 are numbers 1-8, effectively unused
  ordnance: 20,
  interface: 21,
  recon: 22,
  ammunition: 23,
  recover: 24,
  defend: 25,
  neutralize: 26,
  // Megalo Headache #3
  "coop spawning": 27,
};

const resolveNavpointIconIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  const name = requireKeyword(node, location).toLowerCase();
  // MegaloEdit Headache #3
  if (
    name === "coop spawning" &&
    !ctx.frontend.megacrowExtensions.coopSpawningWaypointIcon
  ) {
    throw new LowerError(
      diagnosticMessages.megacrowExtensionRequired(
        "coopSpawningWaypointIcon",
        "coop spawning"
      ),
      node.location
    );
  }
  const mapped = NAVPOINT_ICON_BY_NAME[name];
  if (mapped !== undefined) {
    return mapped;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("navpoint icon", name),
    node.location
  );
};

export const lowerNavpointSetIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const icon = resolveNavpointIconIndex(parameters[1]!, ctx, location);
  // MegaloEdit: when icon is `num` (11), a custom number variable follows.
  if (icon === 11) {
    if (parameters.length !== 3) {
      throw new LowerError(
        diagnosticMessages.invalidParameterCount(3, parameters.length),
        location
      );
    }
    return {
      type: ActionType.NavpointSetIcon,
      parameters: {
        navpoint: resolveObjectReference(parameters[0]!, paramCtx),
        icon,
        number: resolveCustomVariableReference(parameters[2]!, paramCtx),
      },
    };
  }
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  return {
    type: ActionType.NavpointSetIcon,
    parameters: {
      navpoint: resolveObjectReference(parameters[0]!, paramCtx),
      icon,
    },
  };
};
