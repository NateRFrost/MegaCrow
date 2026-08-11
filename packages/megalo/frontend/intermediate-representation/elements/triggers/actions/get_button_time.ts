import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  ScriptableGameButtons,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "../../../parameters";
import { requireKeyword, requireParamCount } from "../helpers";

const SCRIPTABLE_GAME_BUTTON_BY_NAME: Record<string, ScriptableGameButtons> = {
  jump: ScriptableGameButtons.Jump,
  grenade: ScriptableGameButtons.Grenade,
  switch_weapon: ScriptableGameButtons.SwitchWeapon,
  context_primary: ScriptableGameButtons.ContextPrimary,
  melee_attack: ScriptableGameButtons.MeleeAttack,
  equipment: ScriptableGameButtons.Equipment,
  throw_grenade: ScriptableGameButtons.ThrowGrenade,
  fire_primary: ScriptableGameButtons.FirePrimary,
  crouch: ScriptableGameButtons.Crouch,
  scope_zoom: ScriptableGameButtons.ScopeZoom,
  night_vision: ScriptableGameButtons.NightVision,
  fire_secondary: ScriptableGameButtons.FireSecondary,
  fire_tertiary: ScriptableGameButtons.FireTertiary,
  vehicle_trick: ScriptableGameButtons.VehicleTrick,
};

export const lowerGetButtonTime = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const buttonName = requireKeyword(parameters[1]!, location).toLowerCase();
  const button = SCRIPTABLE_GAME_BUTTON_BY_NAME[buttonName];
  if (button === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("game button", buttonName),
      parameters[1]!.location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.GetButtonTime,
    parameters: {
      player: resolvePlayerReference(parameters[0]!, paramCtx),
      button,
      timeOut: resolveCustomVariableReference(parameters[2]!, paramCtx),
    },
  };
};
