import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  ScriptableGameButtons,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveCustomVariableReference,
  resolvePlayerReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireKeyword, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
