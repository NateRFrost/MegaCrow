import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritablePlayer } from "src/frontend/intermediate-representation/diagnostics";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolvePlayerReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerPlayerDeathGetKillingPlayer = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);

  const paramCtx = asParameterLoweringContext(ctx);
  const __writableOut = resolvePlayerReference(parameters[1]!, paramCtx);
  assertWritablePlayer(__writableOut, parameters[1]!.location);

  return {
    type: ActionType.player_death_get_killing_player,

    parameters: {
      deadPlayer: resolvePlayerReference(parameters[0]!, paramCtx),

      killingPlayerOut: __writableOut,
    },
  };
};
