import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  BipedGiveWeaponMode,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveObjectReference,
  resolveObjectTypeReference,
} from "../../../parameters";
import { requireKeyword, requireParamCount } from "../helpers";

const BIPED_GIVE_WEAPON_MODE_BY_NAME: Record<string, BipedGiveWeaponMode> = {
  primary: BipedGiveWeaponMode.Primary,
  secondary: BipedGiveWeaponMode.Secondary,
  force: BipedGiveWeaponMode.Force,
};

export const lowerBipedGiveWeapon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const modeName = requireKeyword(parameters[2]!, location).toLowerCase();
  const mode = BIPED_GIVE_WEAPON_MODE_BY_NAME[modeName];
  if (mode === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("weapon slot", modeName),
      parameters[2]!.location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.BipedGiveWeapon,
    parameters: {
      biped: resolveObjectReference(parameters[0]!, paramCtx),
      weapon: resolveObjectTypeReference(parameters[1]!, paramCtx),
      mode,
    },
  };
};
