import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveObjectReference,
  resolveTeamReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

export const lowerTeamSetPrimaryRespawnObject = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  const paramCtx = asParameterLoweringContext(ctx);

  return {
    type: ActionType.TeamSetPrimaryRespawnObject,

    parameters: {
      team: resolveTeamReference(parameters[0]!, paramCtx),

      respawnObject: resolveObjectReference(parameters[1]!, paramCtx),
    },
  };
};
