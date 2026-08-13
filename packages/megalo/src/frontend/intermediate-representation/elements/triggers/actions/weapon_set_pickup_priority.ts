import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  requireKeyword,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  WeaponPickupPriority,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const WEAPON_PICKUP_PRIORITY_BY_NAME: Record<string, WeaponPickupPriority> = {
  normal: WeaponPickupPriority.Normal,
  special: WeaponPickupPriority.Special,
  auto: WeaponPickupPriority.Automatic,
};

export const lowerWeaponSetPickupPriority = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const priorityName = requireKeyword(parameters[1]!, location).toLowerCase();
  const priority = WEAPON_PICKUP_PRIORITY_BY_NAME[priorityName];
  if (priority === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "weapon pickup priority",
        priorityName
      ),
      parameters[1]?.location
    );
  }
  return {
    type: ActionType.WeaponSetPickupPriority,
    parameters: {
      weapon: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      priority,
    },
  };
};
