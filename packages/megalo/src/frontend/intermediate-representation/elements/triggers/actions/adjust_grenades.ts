import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  parseMathOperation,
  requireKeyword,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  GrenadeType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const GRENADE_TYPE_BY_NAME: Record<string, GrenadeType> = {
  frag: GrenadeType.Frag,
  plasma: GrenadeType.Plasma,
};

export const lowerAdjustGrenades = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 4, location);
  const grenadeName = requireKeyword(parameters[1]!, location).toLowerCase();
  const grenadeType = GRENADE_TYPE_BY_NAME[grenadeName];
  if (grenadeType === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("grenade type", grenadeName),
      parameters[1]?.location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.AdjustGrenades,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      grenadeType,
      operation: parseMathOperation(parameters[2]!, location),
      amount: resolveCustomVariableReference(parameters[3]!, paramCtx),
    },
  };
};
