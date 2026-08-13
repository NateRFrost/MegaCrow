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
  lowerConstantInteger,
  type ElementLowerContext,
} from "../../../parameters";
import { resolvePlayerReference } from "../../../parameters";

export const lowerPlayerSetObjectiveAllegianceIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const iconIndex = lowerConstantInteger(
    parameters[1]!,
    paramCtx,
    "constant integer",
    location,
  ).value;
  if (iconIndex !== -1 && (iconIndex < 0 || iconIndex >= 128)) {
    throw new LowerError(
      diagnosticMessages.iconIndexOutOfRange(),
      parameters[1]!.location ?? location,
    );
  }
  return {
    type: ActionType.PlayerSetObjectiveAllegianceIcon,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      iconIndex,
    },
  };
};
