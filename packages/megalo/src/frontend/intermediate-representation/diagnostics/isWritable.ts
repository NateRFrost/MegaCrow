import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  type CustomTimerReference,
  type CustomVariableReference,
  CustomVariableType,
  type ObjectReference,
  ObjectReferenceType,
  type PlayerReference,
  PlayerReferenceType,
  type TeamReference,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";

/**
 * Matches `c_explicit_object::is_writeable`: globals 0–15 or temporaries 0–7.
 */
export const isWritableExplicitObject = (object: ExplicitObject): boolean =>
  (object >= ExplicitObject.Global0 && object <= ExplicitObject.Global15) ||
  (object >= ExplicitObject.Temporary0 && object <= ExplicitObject.Temporary7);

/**
 * Matches `c_explicit_player::is_writeable`: globals 0–7 or temporaries 0–2.
 */
export const isWritableExplicitPlayer = (player: ExplicitPlayer): boolean =>
  (player >= ExplicitPlayer.Global0 && player <= ExplicitPlayer.Global7) ||
  (player >= ExplicitPlayer.Temporary0 && player <= ExplicitPlayer.Temporary2);

/**
 * Matches `c_explicit_team::is_writeable`: neutral + globals 0–6, or
 * target_team + temporaries 0–4. (Global7 / current / local / temp5 are not.)
 */
export const isWritableExplicitTeam = (team: ExplicitTeam): boolean =>
  (team >= ExplicitTeam.neutral && team <= ExplicitTeam.Global6) ||
  (team >= ExplicitTeam.TargetTeam && team <= ExplicitTeam.Temporary4);

/** Player biped object-ref kinds cannot be written (MegaloEdit `is_player_reference`). */
const isPlayerObjectReference = (ref: ObjectReference): boolean =>
  ref.type === ObjectReferenceType.PlayerBiped ||
  ref.type === ObjectReferenceType.PlayerPlayerBiped ||
  ref.type === ObjectReferenceType.ObjectPlayerBiped ||
  ref.type === ObjectReferenceType.TeamPlayerBiped;

/**
 * Matches `c_object_reference::is_writeable`:
 * (type != global_object || explicit.is_writeable) && !is_player_reference
 */
export const isWritableObjectReference = (ref: ObjectReference): boolean => {
  if (isPlayerObjectReference(ref)) {
    return false;
  }
  if (ref.type === ObjectReferenceType.GlobalObject) {
    return isWritableExplicitObject(ref.object);
  }
  return true;
};

/**
 * Matches `c_player_reference::is_writeable`:
 * type != global_player || explicit.is_writeable
 */
export const isWritablePlayerReference = (ref: PlayerReference): boolean => {
  if (ref.type === PlayerReferenceType.GlobalPlayer) {
    return isWritableExplicitPlayer(ref.player);
  }
  return true;
};

/**
 * Matches `c_team_reference::is_writeable`:
 * type != global_team || explicit.is_writeable
 */
export const isWritableTeamReference = (ref: TeamReference): boolean => {
  if (ref.type === TeamReferenceType.GlobalTeam) {
    return isWritableExplicitTeam(ref.team);
  }
  return true;
};

/**
 * MegaloEdit custom-variable writeable type allowlist (nested explicits are
 * not re-checked with must_be_writeable).
 */
const WRITABLE_CUSTOM_VARIABLE_TYPES = new Set<CustomVariableType>([
  CustomVariableType.PlayerNumber,
  CustomVariableType.ObjectNumber,
  CustomVariableType.TeamNumber,
  CustomVariableType.GlobalNumber,
  CustomVariableType.TeamScore,
  CustomVariableType.PlayerScore,
  CustomVariableType.PlayerMoney,
  CustomVariableType.PlayerStat,
  CustomVariableType.TeamStat,
  CustomVariableType.SymmetricGametypePregame,
  CustomVariableType.TemporaryNumber,
]);

export const isWritableCustomVariable = (
  ref: CustomVariableReference
): boolean => WRITABLE_CUSTOM_VARIABLE_TYPES.has(ref.type);

/**
 * `c_custom_timer_reference::is_writeable` is a trivial always-true stub;
 * networked-in-local is a separate MegaloEdit check.
 */
export const isWritableCustomTimer = (_ref: CustomTimerReference): boolean =>
  true;

export const isWritableVariantVariable = (ref: VariantVariable): boolean => {
  switch (ref.type) {
    case VariantVariableType.CustomVariable:
      return isWritableCustomVariable(ref.customVariable);
    case VariantVariableType.Player:
      return isWritablePlayerReference(ref.player);
    case VariantVariableType.Object:
      return isWritableObjectReference(ref.object);
    case VariantVariableType.Team:
      return isWritableTeamReference(ref.team);
    case VariantVariableType.CustomTimer:
      return isWritableCustomTimer(ref.customTimer);
  }
};
