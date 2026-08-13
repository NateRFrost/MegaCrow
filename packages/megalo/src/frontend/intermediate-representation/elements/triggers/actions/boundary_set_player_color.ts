import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import {
  PlayerReferenceType,
  type PlayerReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveObjectReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
