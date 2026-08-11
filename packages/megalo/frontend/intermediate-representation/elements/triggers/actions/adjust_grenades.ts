import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  GrenadeType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "../../../parameters";
import {
  parseMathOperation,
  requireKeyword,
  requireParamCount,
} from "../helpers";

const GRENADE_TYPE_BY_NAME: Record<string, GrenadeType> = {
  frag: GrenadeType.Frag,
  plasma: GrenadeType.Plasma,
};

export const lowerAdjustGrenades = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 4, location);
  const grenadeName = requireKeyword(parameters[1]!, location).toLowerCase();
  const grenadeType = GRENADE_TYPE_BY_NAME[grenadeName];
  if (grenadeType === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("grenade type", grenadeName),
      parameters[1]!.location,
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
