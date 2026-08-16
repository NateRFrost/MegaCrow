import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritablePlayer } from "src/frontend/intermediate-representation/diagnostics";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveObjectReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerGetPlayerHoldingObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const playerOut = resolvePlayerReference(parameters[1]!, paramCtx);
  assertWritablePlayer(playerOut, parameters[1]!.location);
  return {
    type: ActionType.get_player_holding_object,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      playerOut,
    },
  };
};
