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
  BipedGiveWeaponMode,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveObjectReference,
  resolveObjectTypeReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

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
      parameters[2]?.location
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
