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
  grenadeType as grenadeTypeEnum,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerAdjustGrenades = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 4, location);
  const grenadeName = requireKeyword(parameters[1]!, location).toLowerCase();
  const grenadeType = grenadeTypeEnum.parse(grenadeName);
  if (grenadeType === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("grenade type", grenadeName),
      parameters[1]?.location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.adjust_grenades,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      grenadeType,
      operation: parseMathOperation(parameters[2]!, location),
      amount: resolveCustomVariableReference(parameters[3]!, paramCtx),
    },
  };
};
