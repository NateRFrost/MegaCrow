import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  WeaponPickupPriority,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveObjectReference } from "../../../parameters";
import { requireKeyword, requireParamCount } from "../helpers";

const WEAPON_PICKUP_PRIORITY_BY_NAME: Record<string, WeaponPickupPriority> = {
  normal: WeaponPickupPriority.Normal,
  special: WeaponPickupPriority.Special,
  auto: WeaponPickupPriority.Automatic,
};

export const lowerWeaponSetPickupPriority = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  const priorityName = requireKeyword(parameters[1]!, location).toLowerCase();
  const priority = WEAPON_PICKUP_PRIORITY_BY_NAME[priorityName];
  if (priority === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "weapon pickup priority",
        priorityName,
      ),
      parameters[1]!.location,
    );
  }
  return {
    type: ActionType.WeaponSetPickupPriority,
    parameters: {
      weapon: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      priority,
    },
  };
};
