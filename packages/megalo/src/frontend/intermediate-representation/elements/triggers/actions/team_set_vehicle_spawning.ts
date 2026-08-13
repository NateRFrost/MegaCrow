import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  parseBooleanLiteral,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveTeamReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerTeamSetVehicleSpawning = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.TeamSetVehicleSpawning,

    parameters: {
      team: resolveTeamReference(
        parameters[0]!,

        asParameterLoweringContext(ctx)
      ),

      enabled: parseBooleanLiteral(parameters[1]!, ctx, location),
    },
  };
};
