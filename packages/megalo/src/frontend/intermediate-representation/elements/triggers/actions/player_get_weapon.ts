import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveObjectReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireKeyword, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

export const lowerPlayerGetWeapon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const slotName = requireKeyword(parameters[1]!, location).toLowerCase();
  const primary = slotName === "primary";
  if (slotName !== "primary" && slotName !== "secondary") {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("weapon slot", slotName),
      parameters[1]!.location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.PlayerGetWeapon,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      primary,
      weapon: resolveObjectReference(parameters[2]!, paramCtx),
    },
  };
};
