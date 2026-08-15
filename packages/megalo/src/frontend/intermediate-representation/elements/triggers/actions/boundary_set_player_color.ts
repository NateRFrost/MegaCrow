import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import {
  type PlayerReference,
  PlayerReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  resolveObjectReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

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
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const player = resolvePlayerReference(parameters[1]!, paramCtx);
  return {
    type: ActionType.boundary_set_player_color,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      playerIndex: extractBoundaryPlayerColorIndex(player),
    },
  };
};
