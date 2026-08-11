import {
  type c_game_engine_custom_variant,
  c_condition,
  e_disposition,
  e_numeric_comparison,
  e_player_death_killer_type_flags_none,
  s_condition_equipment_is_active_parameters,
  s_condition_game_is_forge_parameters,
  s_condition_if_parameters,
  s_condition_object_in_area_parameters,
  s_condition_object_is_type_parameters,
  s_condition_object_matches_filter_parameters,
  s_condition_object_out_of_bounds_parameters,
  s_condition_player_assisted_with_kill_parameters,
  s_condition_player_died_parameters,
  s_condition_player_is_active_parameters,
  s_condition_player_is_editor_parameters,
  s_condition_player_is_elite_parameters,
  s_condition_player_is_fire_team_leader_parameters,
  s_condition_player_is_spartan_parameters,
  s_condition_team_disposition_parameters,
  s_condition_team_is_active_parameters,
  s_condition_timer_expired_parameters,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { Diagnostics } from "../../diagnostics";
import type { IR } from "../../intermediate-representation";
import {
  ConditionType,
  Disposition,
  NumericComparison,
  type Condition,
  type PlayerDeathKillerTypeFlags,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import { encodeConditionType } from "./enums/e_condition_type";
import {
  encodeCustomTimerReference,
  encodeObjectReference,
  encodeObjectTypeReference,
  encodePlayerReference,
  encodeTeamReference,
  encodeVariantVariable,
} from "./references";

const encodeNumericComparison = (
  value: NumericComparison
): e_numeric_comparison => {
  switch (value) {
    case NumericComparison.LessThan:
      return e_numeric_comparison.less_than;
    case NumericComparison.GreaterThan:
      return e_numeric_comparison.greater_than;
    case NumericComparison.EqualTo:
      return e_numeric_comparison.equal_to;
    case NumericComparison.LessThanOrEqualTo:
      return e_numeric_comparison.less_than_or_equal_to;
    case NumericComparison.GreaterThanOrEqualTo:
      return e_numeric_comparison.greater_than_or_equal_to;
    case NumericComparison.NotEqualTo:
      return e_numeric_comparison.not_equal_to;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};

const encodeDisposition = (value: Disposition): e_disposition => {
  switch (value) {
    case Disposition.Neutral:
      return e_disposition.neutral;
    case Disposition.Friendly:
      return e_disposition.friendly;
    case Disposition.Enemy:
      return e_disposition.enemy;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};

const encodeKillerTypeFlags = (value: PlayerDeathKillerTypeFlags) => {
  const flags = e_player_death_killer_type_flags_none();
  flags.environment = value.environment;
  flags.suicide = value.suicide;
  flags.enemy = value.enemy;
  flags.betrayal = value.betrayal;
  flags.quit_game = value.quit_game;
  return flags;
};

const compileCondition = (condition: Condition): c_condition => {
  const target = new c_condition();
  target.m_type = encodeConditionType(condition.type);
  target.m_negated = condition.negated;
  target.m_union_group = condition.unionGroup;
  target.m_execute_before_action = condition.executeBeforeAction;

  switch (condition.type) {
    case ConditionType.GameIsForge: {
      target.m_game_is_forge_parameters =
        new s_condition_game_is_forge_parameters();
      break;
    }
    case ConditionType.If: {
      const params = new s_condition_if_parameters();
      params.m_left = encodeVariantVariable(condition.parameters.left);
      params.m_right = encodeVariantVariable(condition.parameters.right);
      params.m_comparison = encodeNumericComparison(
        condition.parameters.comparison
      );
      target.m_if_parameters = params;
      break;
    }
    case ConditionType.ObjectInArea: {
      const params = new s_condition_object_in_area_parameters();
      params.m_object_reference_1 = encodeObjectReference(
        condition.parameters.object
      );
      params.m_object_reference_2 = encodeObjectReference(
        condition.parameters.area
      );
      target.m_object_in_area_parameters = params;
      break;
    }
    case ConditionType.PlayerDied: {
      const params = new s_condition_player_died_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      params.m_killer_type = encodeKillerTypeFlags(
        condition.parameters.killerType
      );
      target.m_player_died_parameters = params;
      break;
    }
    case ConditionType.TeamDisposition: {
      const params = new s_condition_team_disposition_parameters();
      params.m_team_1 = encodeTeamReference(condition.parameters.team1);
      params.m_team_2 = encodeTeamReference(condition.parameters.team2);
      params.m_disposition = encodeDisposition(condition.parameters.disposition);
      target.m_team_disposition_parameters = params;
      break;
    }
    case ConditionType.TimerExpired: {
      const params = new s_condition_timer_expired_parameters();
      params.m_timer = encodeCustomTimerReference(condition.parameters.timer);
      target.m_timer_expired_parameters = params;
      break;
    }
    case ConditionType.ObjectIsType: {
      const params = new s_condition_object_is_type_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      params.m_object_type = encodeObjectTypeReference(
        condition.parameters.objectType
      );
      target.m_object_is_type_parameters = params;
      break;
    }
    case ConditionType.TeamIsActive: {
      const params = new s_condition_team_is_active_parameters();
      params.m_team = encodeTeamReference(condition.parameters.team);
      target.m_team_is_active_parameters = params;
      break;
    }
    case ConditionType.ObjectOutOfBounds: {
      const params = new s_condition_object_out_of_bounds_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      target.m_object_out_of_bounds_parameters = params;
      break;
    }
    case ConditionType.PlayerIsFireTeamLeader: {
      const params = new s_condition_player_is_fire_team_leader_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_fire_team_leader_parameters = params;
      break;
    }
    case ConditionType.PlayerAssistedWithKill: {
      const params = new s_condition_player_assisted_with_kill_parameters();
      params.m_player_1 = encodePlayerReference(condition.parameters.player1);
      params.m_player_2 = encodePlayerReference(condition.parameters.player2);
      target.m_player_assisted_with_kill_parameters = params;
      break;
    }
    case ConditionType.ObjectMatchesFilter: {
      const params = new s_condition_object_matches_filter_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      params.m_filter_index = condition.parameters.filterIndex;
      target.m_object_matches_filter_parameters = params;
      break;
    }
    case ConditionType.PlayerIsActive: {
      const params = new s_condition_player_is_active_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_active_parameters = params;
      break;
    }
    case ConditionType.EquipmentIsActive: {
      const params = new s_condition_equipment_is_active_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      target.m_equipment_is_active_parameters = params;
      break;
    }
    case ConditionType.PlayerIsSpartan: {
      const params = new s_condition_player_is_spartan_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_spartan_parameters = params;
      break;
    }
    case ConditionType.PlayerIsElite: {
      const params = new s_condition_player_is_elite_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_elite_parameters = params;
      break;
    }
    case ConditionType.PlayerIsEditor: {
      const params = new s_condition_player_is_editor_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_editor_parameters = params;
      break;
    }
  }

  return target;
};

export const compileConditions = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant,
  _diagnostics: Diagnostics
): void => {
  gameVariant.m_game_engine.m_conditions =
    ir.gameVariant.gameEngine.conditions.map((condition) =>
      compileCondition(condition)
    );
};
