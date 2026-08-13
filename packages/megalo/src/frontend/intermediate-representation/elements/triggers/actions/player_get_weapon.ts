import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
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
import { requireKeyword, requireParamCount } from "../helpers";

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
