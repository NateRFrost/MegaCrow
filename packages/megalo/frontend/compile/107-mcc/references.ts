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
  e_custom_variable_type,
  e_explicit_object_type,
  e_explicit_player_type,
  e_explicit_team_type,
  e_megalogamengine_hud_meter_input_type,
  e_object_reference_type,
  e_player_filter_type,
  e_player_purchase_mode_flags,
  e_player_reference_type,
  e_replaceable_token_type,
  e_team_reference_type,
  e_variable_type,
  s_object_offset,
  s_team_or_player_target,
  s_variant_variable,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { ExplicitObject } from "../../intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import type { ExplicitPlayer } from "../../intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import type { ExplicitTeam } from "../../intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  CustomTimerType,
  CustomVariableType,
  ObjectReferenceType,
  PlayerReferenceType,
  TeamReferenceType,
  type CustomTimerReference,
  type CustomVariableReference,
  type ObjectReference,
  type ObjectTypeReference,
  type PlayerReference,
  type TeamReference,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  ReplaceableTokenType,
  type DynamicString,
  type ReplaceableToken,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_text";
import {
  VariableType,
  type VariantVariable,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import { HUDMeterInputType } from "../../intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import {
  BoundaryShape,
  PlayerFilterType,
  TeamOrPlayerTargetKind,
  type CreateObjectParameters,
  type HUDMeterInput,
  type ObjectOffset,
  type PlayerFilterModifier,
  type PlayerPurchaseMode,
  type TeamOrPlayerTarget,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_actions";

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

export const encodeTeamReference = (
  value: TeamReference
): c_team_reference => {
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
  target.m_type = value.type as unknown as e_player_filter_type;
  if (value.type === PlayerFilterType.SpecificPlayer) {
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
  target.m_string_index = value.stringIndex;
  target.m_tokens = value.tokens.map(encodeReplaceableToken);
  return target;
};

export const encodeTeamOrPlayerTarget = (
  value: TeamOrPlayerTarget
): s_team_or_player_target => {
  const target = new s_team_or_player_target();
  switch (value.type) {
    case TeamOrPlayerTargetKind.Team:
      target.m_target = e_action_team_or_player_target.team;
      target.m_team = encodeTeamReference(value.team);
      break;
    case TeamOrPlayerTargetKind.Player:
      target.m_target = e_action_team_or_player_target.player;
      target.m_player = encodePlayerReference(value.player);
      break;
    case TeamOrPlayerTargetKind.Everyone:
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
): e_player_purchase_mode_flags => {
  const flags = new e_player_purchase_mode_flags();
  flags.alive_weapons = value.aliveWeapons;
  flags.alive_equipment = value.aliveEquipment;
  flags.alive_vehicles = value.aliveVehicles;
  flags.dead_weapons = value.deadWeapons;
  flags.dead_equipment = value.deadEquipment;
  return flags;
};

/** BLF `e_boundary_shape`: unused=0, sphere=1, cylinder=2, box=3. */
export const encodeBoundaryShape = (value: BoundaryShape): number => {
  switch (value) {
    case BoundaryShape.Sphere:
      return 1;
    case BoundaryShape.Cylinder:
      return 2;
    case BoundaryShape.Box:
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
  switch (value.meterType) {
    case HUDMeterInputType.Number: {
      target.m_type = e_megalogamengine_hud_meter_input_type.number;
      target.m_variable_1 = encodeCustomVariableReference(value.value);
      target.m_variable_2 = encodeCustomVariableReference(value.max);
      break;
    }
    case HUDMeterInputType.Timer: {
      target.m_type = e_megalogamengine_hud_meter_input_type.timer;
      target.m_timer = encodeCustomTimerReference(value.timer);
      break;
    }
    case HUDMeterInputType.None:
      target.m_type = e_megalogamengine_hud_meter_input_type.none;
      break;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
  return target;
};
