import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolvePlayerReference } from "../../../parameters";
import { parseBooleanLiteral, requireParamCount } from "../helpers";

export const lowerPlayerSetVehicleSpawning = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.PlayerSetVehicleSpawning,

    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      enabled: parseBooleanLiteral(parameters[1]!, location),
    },
  };
};
