import { e_condition_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ConditionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

export const encodeConditionType = (value: ConditionType): e_condition_type => {
  switch (value) {
    case ConditionType.None:
      return e_condition_type.none;
    case ConditionType.If:
      return e_condition_type.if;
    case ConditionType.ObjectInArea:
      return e_condition_type.object_in_area;
    case ConditionType.PlayerDied:
      return e_condition_type.player_died;
    case ConditionType.TeamDisposition:
      return e_condition_type.team_disposition;
    case ConditionType.TimerExpired:
      return e_condition_type.timer_expired;
    case ConditionType.ObjectIsType:
      return e_condition_type.object_is_type;
    case ConditionType.TeamIsActive:
      return e_condition_type.team_is_active;
    case ConditionType.ObjectOutOfBounds:
      return e_condition_type.object_out_of_bounds;
    case ConditionType.PlayerIsFireTeamLeader:
      return e_condition_type.player_is_fire_team_leader;
    case ConditionType.PlayerAssistedWithKill:
      return e_condition_type.player_assisted_with_kill;
    case ConditionType.ObjectMatchesFilter:
      return e_condition_type.object_matches_filter;
    case ConditionType.PlayerIsActive:
      return e_condition_type.player_is_active;
    case ConditionType.EquipmentIsActive:
      return e_condition_type.equipment_is_active;
    case ConditionType.PlayerIsSpartan:
      return e_condition_type.player_is_spartan;
    case ConditionType.PlayerIsElite:
      return e_condition_type.player_is_elite;
    case ConditionType.PlayerIsEditor:
      return e_condition_type.player_is_editor;
    case ConditionType.GameIsForge:
      return e_condition_type.game_is_forge;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
