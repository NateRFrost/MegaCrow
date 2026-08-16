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

export const lowerPlayerDeathGetSpecialType = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);

  const paramCtx = asParameterLoweringContext(ctx);
  const __writableOut = resolveCustomVariableReference(
    parameters[1]!,
    paramCtx
  );
  assertWritableNumeric(__writableOut, parameters[1]!.location);

  return {
    type: ActionType.player_death_get_special_type,

    parameters: {
      deadPlayer: resolvePlayerReference(parameters[0]!, paramCtx),

      specialTypeOut: __writableOut,
    },
  };
};
