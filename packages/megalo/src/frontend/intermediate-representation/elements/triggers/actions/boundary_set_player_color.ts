import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { ExplicitPlayer } from "../../../game/megalogamengine/megalogamengine_explicit_player";
import {
  PlayerReferenceType,
  type PlayerReference,
} from "../../../game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveObjectReference,
  resolvePlayerReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

const extractBoundaryPlayerColorIndex = (player: PlayerReference): number => {
  if (player.type !== PlayerReferenceType.GlobalPlayer) {
    return 0;
  }
  const explicit = player.player;
  if (
    explicit >= ExplicitPlayer.Player0 &&
    explicit <= ExplicitPlayer.Player15
  ) {
    return explicit - ExplicitPlayer.Player0;
  }
  if (
    explicit >= ExplicitPlayer.Global0 &&
    explicit <= ExplicitPlayer.Global7
  ) {
    return explicit - ExplicitPlayer.Global0;
  }
  return 0;
};

export const lowerBoundarySetPlayerColor = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const player = resolvePlayerReference(parameters[1]!, paramCtx);
  return {
    type: ActionType.BoundarySetPlayerColor,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      playerIndex: extractBoundaryPlayerColorIndex(player),
    },
  };
};
