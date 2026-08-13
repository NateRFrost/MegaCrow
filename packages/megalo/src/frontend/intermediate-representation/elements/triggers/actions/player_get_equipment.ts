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
  resolvePlayerReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

export const lowerPlayerGetEquipment = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  const paramCtx = asParameterLoweringContext(ctx);

  return {
    type: ActionType.PlayerGetEquipment,

    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),

      equipmentOut: resolveObjectReference(parameters[1]!, paramCtx),
    },
  };
};
