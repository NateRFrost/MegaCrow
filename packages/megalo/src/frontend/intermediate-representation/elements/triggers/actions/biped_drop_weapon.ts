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
import { resolveObjectReference } from "../../../parameters";
import { hasOptionalKeyword, requireKeyword } from "../helpers";

export const lowerBipedDropWeapon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const slotName = requireKeyword(parameters[1]!, location).toLowerCase();
  const primary = slotName === "primary";
  if (slotName !== "primary" && slotName !== "secondary") {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("weapon slot", slotName),
      parameters[1]!.location,
    );
  }
  return {
    type: ActionType.BipedDropWeapon,
    parameters: {
      biped: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      primary,
      deleteOnDrop: hasOptionalKeyword(parameters, "delete_on_drop"),
    },
  };
};
