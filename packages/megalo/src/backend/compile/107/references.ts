import {
  c_custom_timer_reference,
  c_custom_variable_reference,
  c_dynamic_string,
  c_explicit_object,
  c_explicit_player,
  c_explicit_team,
  c_megalogamengine_hud_meter_input,
  c_object_reference,
  c_object_type_reference,
  c_player_filter_modifier,
  c_player_reference,
  c_replaceable_token,
  c_team_reference,
  e_action_team_or_player_target,
  e_create_object_flags,
  e_custom_timer_type,
  type e_custom_variable_type,
  type e_explicit_object_type,
  type e_explicit_player_type,
  type e_explicit_team_type,
  e_object_reference_type,
  e_player_reference_type,
  e_replaceable_token_type,
  e_team_reference_type,
  e_variable_type,
  s_object_offset,
  s_team_or_player_target,
  s_variant_variable,
} from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import {
  encodeHUDMeterInputType,
  encodePlayerFilterType,
} from "src/backend/compile/107/enums";
import {
  BoundaryShape,
  type CreateObjectParameters,
  type HUDMeterInput,
  type ObjectOffset,
  type PlayerFilterModifier,
  PlayerFilterType,
  type PlayerPurchaseMode,
  type TeamOrPlayerTarget,
  TeamOrPlayerTargetKind,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import type { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import type { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import { HUDMeterInputType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import {
  type CustomTimerReference,
  CustomTimerType,
  type CustomVariableReference,
  CustomVariableType,
  type ObjectReference,
  ObjectReferenceType,
  type ObjectTypeReference,
  type PlayerReference,
  PlayerReferenceType,
  type TeamReference,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type DynamicString,
  type ReplaceableToken,
  ReplaceableTokenType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_text";
import {
  VariableType,
  type VariantVariable,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";

export const encodeExplicitPlayer = (
  value: ExplicitPlayer
): c_explicit_player => {
  const target = new c_explicit_player();
  target.m_explicit_player_type = value as unknown as e_explicit_player_type;
  return target;
};

export const encodeExplicitObject = (
  value: ExplicitObject
): c_explicit_object => {
  const target = new c_explicit_object();
  target.m_explicit_object_type = value as unknown as e_explicit_object_type;
  return target;
};

export const encodeExplicitTeam = (value: ExplicitTeam): c_explicit_team => {
  const target = new c_explicit_team();
  target.m_explicit_team_type = value as unknown as e_explicit_team_type;
  return target;
};

export const encodePlayerReference = (
  value: PlayerReference
): c_player_reference => {
  const target = new c_player_reference();
  switch (value.type) {
    case PlayerReferenceType.GlobalPlayer:
      target.m_type = e_player_reference_type.global_player;
      target.m_player = encodeExplicitPlayer(value.player);
      break;
    case PlayerReferenceType.PlayerPlayer:
      target.m_type = e_player_reference_type.player_player;
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case PlayerReferenceType.ObjectPlayer:
      target.m_type = e_player_reference_type.object_player;
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case PlayerReferenceType.TeamPlayer:
      target.m_type = e_player_reference_type.team_player;
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeObjectReference = (
  value: ObjectReference
): c_object_reference => {
  const target = new c_object_reference();
  switch (value.type) {
    case ObjectReferenceType.GlobalObject:
      target.m_type = e_object_reference_type.global_object;
      target.m_object = encodeExplicitObject(value.object);
      break;
    case ObjectReferenceType.PlayerObject:
      target.m_type = e_object_reference_type.player_object;
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case ObjectReferenceType.ObjectObject:
      target.m_type = e_object_reference_type.object_object;
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case ObjectReferenceType.TeamObject:
      target.m_type = e_object_reference_type.team_object;
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    case ObjectReferenceType.PlayerBiped:
      target.m_type = e_object_reference_type.player_biped;
      target.m_player = encodeExplicitPlayer(value.player);
      break;
    case ObjectReferenceType.PlayerPlayerBiped:
      target.m_type = e_object_reference_type.player_player_biped;
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case ObjectReferenceType.ObjectPlayerBiped:
      target.m_type = e_object_reference_type.object_player_biped;
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case ObjectReferenceType.TeamPlayerBiped:
      target.m_type = e_object_reference_type.team_player_biped;
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeTeamReference = (value: TeamReference): c_team_reference => {
  const target = new c_team_reference();
  switch (value.type) {
    case TeamReferenceType.GlobalTeam:
      target.m_type = e_team_reference_type.global_team;
      target.m_team = encodeExplicitTeam(value.team);
      break;
    case TeamReferenceType.PlayerTeam:
      target.m_type = e_team_reference_type.player_team;
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case TeamReferenceType.ObjectTeam:
      target.m_type = e_team_reference_type.object_team;
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case TeamReferenceType.TeamTeam:
      target.m_type = e_team_reference_type.team_team;
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    case TeamReferenceType.PlayerOwnerTeam:
      target.m_type = e_team_reference_type.player_owner_team;
      target.m_player = encodeExplicitPlayer(value.player);
      break;
    case TeamReferenceType.ObjectOwnerTeam:
      target.m_type = e_team_reference_type.object_owner_team;
      target.m_object = encodeExplicitObject(value.object);
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeCustomVariableReference = (
  value: CustomVariableReference
): c_custom_variable_reference => {
  const target = new c_custom_variable_reference();
  target.m_type = value.type as unknown as e_custom_variable_type;

  switch (value.type) {
    case CustomVariableType.Constant:
      target.m_immediate_value = value.immediateValue;
      break;
    case CustomVariableType.PlayerNumber:
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomVariableType.ObjectNumber:
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomVariableType.TeamNumber:
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomVariableType.GlobalNumber:
    case CustomVariableType.TemporaryNumber:
      target.m_variable_index = value.variableIndex;
      break;
    case CustomVariableType.Option:
      target.m_option_index = value.optionIndex;
      break;
    case CustomVariableType.SpawnObject:
      target.m_object = encodeExplicitObject(value.object);
      break;
    case CustomVariableType.TeamScore:
      target.m_team = encodeExplicitTeam(value.team);
      break;
    case CustomVariableType.PlayerScore:
    case CustomVariableType.PlayerMoney:
    case CustomVariableType.PlayerRating:
      target.m_player = encodeExplicitPlayer(value.player);
      break;
    case CustomVariableType.PlayerStat:
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_statistic_index = value.statisticIndex;
      break;
    case CustomVariableType.TeamStat:
      target.m_team = encodeExplicitTeam(value.team);
      target.m_statistic_index = value.statisticIndex;
      break;
    default:
      // Type-only builtins carry no payload beyond m_type.
      break;
  }

  return target;
};

export const encodeCustomTimerReference = (
  value: CustomTimerReference
): c_custom_timer_reference => {
  const target = new c_custom_timer_reference();
  switch (value.type) {
    case CustomTimerType.Global:
      target.m_type = e_custom_timer_type.global;
      target.m_variable_index = value.variableIndex;
      break;
    case CustomTimerType.Player:
      target.m_type = e_custom_timer_type.player;
      target.m_player = encodeExplicitPlayer(value.player);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomTimerType.Team:
      target.m_type = e_custom_timer_type.team;
      target.m_team = encodeExplicitTeam(value.team);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomTimerType.Object:
      target.m_type = e_custom_timer_type.object;
      target.m_object = encodeExplicitObject(value.object);
      target.m_variable_index = value.variableIndex;
      break;
    case CustomTimerType.Round:
      target.m_type = e_custom_timer_type.round;
      break;
    case CustomTimerType.SuddenDeath:
      target.m_type = e_custom_timer_type.sudden_death;
      break;
    case CustomTimerType.GracePeriod:
      target.m_type = e_custom_timer_type.grace_period;
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeObjectTypeReference = (
  value: ObjectTypeReference
): c_object_type_reference => {
  const target = new c_object_type_reference();
  target.m_object_type_index = value;
  return target;
};

export const encodeVariantVariable = (
  value: VariantVariable
): s_variant_variable => {
  const target = new s_variant_variable();
  switch (value.type) {
    case VariableType.CustomVariable:
      target.m_type = e_variable_type.custom_variable;
      target.m_custom_variable = encodeCustomVariableReference(
        value.customVariable
      );
      break;
    case VariableType.Player:
      target.m_type = e_variable_type.player;
      target.m_player = encodePlayerReference(value.player);
      break;
    case VariableType.Object:
      target.m_type = e_variable_type.object;
      target.m_object = encodeObjectReference(value.object);
      break;
    case VariableType.Team:
      target.m_type = e_variable_type.team;
      target.m_team = encodeTeamReference(value.team);
      break;
    case VariableType.CustomTimer:
      target.m_type = e_variable_type.custom_timer;
      target.m_custom_timer = encodeCustomTimerReference(value.customTimer);
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodePlayerFilterModifier = (
  value: PlayerFilterModifier
): c_player_filter_modifier => {
  const target = new c_player_filter_modifier();
  target.m_type = encodePlayerFilterType(value.type);
  if (value.type === PlayerFilterType.player) {
    target.m_player = encodePlayerReference(value.player);
    target.m_variable = encodeCustomVariableReference(value.visible);
  }
  return target;
};

const encodeReplaceableToken = (
  value: ReplaceableToken
): c_replaceable_token => {
  const target = new c_replaceable_token();
  switch (value.type) {
    case ReplaceableTokenType.Player:
      target.m_type = e_replaceable_token_type.player;
      target.m_player = encodePlayerReference(value.player);
      break;
    case ReplaceableTokenType.Team:
      target.m_type = e_replaceable_token_type.team;
      target.m_team = encodeTeamReference(value.team);
      break;
    case ReplaceableTokenType.Object:
      target.m_type = e_replaceable_token_type.object;
      target.m_object = encodeObjectReference(value.object);
      break;
    case ReplaceableTokenType.CustomVariable:
      target.m_type = e_replaceable_token_type.custom_variable;
      target.m_custom_variable = encodeCustomVariableReference(
        value.customVariable
      );
      break;
    case ReplaceableTokenType.CustomTimer:
      target.m_type = e_replaceable_token_type.custom_timer;
      target.m_custom_timer = encodeCustomTimerReference(value.customTimer);
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeDynamicString = (value: DynamicString): c_dynamic_string => {
  const target = new c_dynamic_string();
  // 1-indexed, 0 is none
  target.m_string_index = value.stringIndex + 1;
  target.m_tokens = value.tokens.map(encodeReplaceableToken);
  return target;
};

export const encodeTeamOrPlayerTarget = (
  value: TeamOrPlayerTarget
): s_team_or_player_target => {
  const target = new s_team_or_player_target();
  switch (value.type) {
    case TeamOrPlayerTargetKind.team:
      target.m_target = e_action_team_or_player_target.team;
      target.m_team = encodeTeamReference(value.team);
      break;
    case TeamOrPlayerTargetKind.player:
      target.m_target = e_action_team_or_player_target.player;
      target.m_player = encodePlayerReference(value.player);
      break;
    case TeamOrPlayerTargetKind.everyone:
      target.m_target = e_action_team_or_player_target.everyone;
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};

export const encodeObjectOffset = (value: ObjectOffset): s_object_offset => {
  const target = new s_object_offset();
  target.x = value.x;
  target.y = value.y;
  target.z = value.z;
  return target;
};

export const encodeCreateObjectFlags = (
  value: Pick<
    CreateObjectParameters,
    "neverGarbageCollect" | "suppressEffect" | "absoluteOrientation"
  >
): e_create_object_flags => {
  const flags = new e_create_object_flags();
  flags.never_garbage_collect = value.neverGarbageCollect ?? false;
  flags.suppress_effect = value.suppressEffect ?? false;
  flags.absolute_orientation = value.absoluteOrientation ?? false;
  return flags;
};

export const encodePlayerPurchaseModeFlags = (
  value: PlayerPurchaseMode
): number =>
  (value.aliveWeapons ? 1 : 0) |
  (value.aliveEquipment ? 1 << 1 : 0) |
  (value.aliveVehicles ? 1 << 2 : 0) |
  (value.deadWeapons ? 1 << 3 : 0) |
  (value.deadEquipment ? 1 << 4 : 0);

export const encodeBoundaryShape = (value: BoundaryShape): number => {
  switch (value) {
    case BoundaryShape.none:
      return 0;
    case BoundaryShape.sphere:
      return 1;
    case BoundaryShape.cylinder:
      return 2;
    case BoundaryShape.box:
      return 3;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};

export const encodeHudMeterInput = (
  value: HUDMeterInput
): c_megalogamengine_hud_meter_input => {
  const target = new c_megalogamengine_hud_meter_input();
  target.m_type = encodeHUDMeterInputType(value.meterType);
  switch (value.meterType) {
    case HUDMeterInputType.number: {
      target.m_variable_1 = encodeCustomVariableReference(value.value);
      target.m_variable_2 = encodeCustomVariableReference(value.max);
      break;
    }
    case HUDMeterInputType.timer: {
      target.m_timer = encodeCustomTimerReference(value.timer);
      break;
    }
    case HUDMeterInputType.none:
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};
