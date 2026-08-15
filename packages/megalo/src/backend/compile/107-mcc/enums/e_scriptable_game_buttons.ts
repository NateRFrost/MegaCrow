import { e_scriptable_game_buttons } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  ScriptableGameButtons,
  type ScriptableGameButtons as ScriptableGameButtonsName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";

const SCRIPTABLE_GAME_BUTTONS_TO_BLF = {
  [ScriptableGameButtons.jump]: e_scriptable_game_buttons.jump,
  [ScriptableGameButtons.grenade]: e_scriptable_game_buttons.grenade,
  [ScriptableGameButtons.switch_weapon]: e_scriptable_game_buttons.switch_weapon,
  [ScriptableGameButtons.context_primary]:
    e_scriptable_game_buttons.context_primary,
  [ScriptableGameButtons.melee_attack]: e_scriptable_game_buttons.melee_attack,
  [ScriptableGameButtons.equipment]: e_scriptable_game_buttons.equipment,
  [ScriptableGameButtons.throw_grenade]: e_scriptable_game_buttons.throw_grenade,
  [ScriptableGameButtons.fire_primary]: e_scriptable_game_buttons.fire_primary,
  [ScriptableGameButtons.crouch]: e_scriptable_game_buttons.crouch,
  [ScriptableGameButtons.scope_zoom]: e_scriptable_game_buttons.scope_zoom,
  [ScriptableGameButtons.night_vision]: e_scriptable_game_buttons.night_vision,
  [ScriptableGameButtons.fire_secondary]:
    e_scriptable_game_buttons.fire_secondary,
  [ScriptableGameButtons.fire_tertiary]: e_scriptable_game_buttons.fire_tertiary,
  [ScriptableGameButtons.vehicle_trick]: e_scriptable_game_buttons.vehicle_trick,
} as const satisfies Record<
  ScriptableGameButtonsName,
  e_scriptable_game_buttons
>;

export const encodeScriptableGameButtons = (
  value: ScriptableGameButtonsName
): e_scriptable_game_buttons =>
  mapMegaloEnum(value, SCRIPTABLE_GAME_BUTTONS_TO_BLF);
