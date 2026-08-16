import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritableNumeric } from "src/frontend/intermediate-representation/diagnostics";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerPlayerGetFireteamIndex = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const fireteamIndexOut = resolveCustomVariableReference(
    parameters[1]!,
    paramCtx
  );
  assertWritableNumeric(fireteamIndexOut, parameters[1]!.location);
  return {
    type: ActionType.player_get_fireteam_index,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      fireteamIndexOut,
    },
  };
};
