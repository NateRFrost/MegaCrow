import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  hasOptionalKeyword,
  requireKeyword,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerBipedDropWeapon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const slotName = requireKeyword(parameters[1]!, location).toLowerCase();
  const primary = slotName === "primary";
  if (slotName !== "primary" && slotName !== "secondary") {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("weapon slot", slotName),
      parameters[1]?.location
    );
  }
  return {
    type: ActionType.biped_drop_weapon,
    parameters: {
      biped: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      primary,
      deleteOnDrop: hasOptionalKeyword(parameters, "delete_on_drop"),
    },
  };
};
