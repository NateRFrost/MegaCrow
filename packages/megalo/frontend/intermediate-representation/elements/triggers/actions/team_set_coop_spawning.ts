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
import { resolveTeamReference } from "../../../parameters";
import { parseBooleanLiteral, requireParamCount } from "../helpers";

export const lowerTeamSetCoopSpawning = (
  parameters: ASTParameterNode[],

  ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);

  return {
    type: ActionType.TeamSetCoopSpawning,

    parameters: {
      team: resolveTeamReference(
        parameters[0]!,

        asParameterLoweringContext(ctx),
      ),

      coopSpawningEnabled: parseBooleanLiteral(parameters[1]!, ctx, location),
    },
  };
};
