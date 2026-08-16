import {
  c_condition,
  type c_game_engine_custom_variant,
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
} from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { encodeConditionType } from "src/backend/compile/107/enums/e_condition_type";
import { encodeDisposition } from "src/backend/compile/107/enums/e_disposition";
import { encodeNumericComparison } from "src/backend/compile/107/enums/e_numeric_comparison";
import {
  encodeCustomTimerReference,
  encodeObjectReference,
  encodeObjectTypeReference,
  encodePlayerReference,
  encodeTeamReference,
  encodeVariantVariable,
} from "src/backend/compile/107/references";
import type { Diagnostics } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import {
  type Condition,
  ConditionType,
  type PlayerDeathKillerTypeFlags,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

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
    case ConditionType.game_is_forge: {
      target.m_game_is_forge_parameters =
        new s_condition_game_is_forge_parameters();
      break;
    }
    case ConditionType.if: {
      const params = new s_condition_if_parameters();
      params.m_left = encodeVariantVariable(condition.parameters.left);
      params.m_right = encodeVariantVariable(condition.parameters.right);
      params.m_comparison = encodeNumericComparison(
        condition.parameters.comparison
      );
      target.m_if_parameters = params;
      break;
    }
    case ConditionType.object_in_area: {
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
    case ConditionType.player_died: {
      const params = new s_condition_player_died_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      params.m_killer_type = encodeKillerTypeFlags(
        condition.parameters.killerType
      );
      target.m_player_died_parameters = params;
      break;
    }
    case ConditionType.team_disposition: {
      const params = new s_condition_team_disposition_parameters();
      params.m_team_1 = encodeTeamReference(condition.parameters.team1);
      params.m_team_2 = encodeTeamReference(condition.parameters.team2);
      params.m_disposition = encodeDisposition(
        condition.parameters.disposition
      );
      target.m_team_disposition_parameters = params;
      break;
    }
    case ConditionType.timer_expired: {
      const params = new s_condition_timer_expired_parameters();
      params.m_timer = encodeCustomTimerReference(condition.parameters.timer);
      target.m_timer_expired_parameters = params;
      break;
    }
    case ConditionType.object_is_type: {
      const params = new s_condition_object_is_type_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      params.m_object_type = encodeObjectTypeReference(
        condition.parameters.objectType
      );
      target.m_object_is_type_parameters = params;
      break;
    }
    case ConditionType.team_is_active: {
      const params = new s_condition_team_is_active_parameters();
      params.m_team = encodeTeamReference(condition.parameters.team);
      target.m_team_is_active_parameters = params;
      break;
    }
    case ConditionType.object_out_of_bounds: {
      const params = new s_condition_object_out_of_bounds_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      target.m_object_out_of_bounds_parameters = params;
      break;
    }
    case ConditionType.player_is_fire_team_leader: {
      const params = new s_condition_player_is_fire_team_leader_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_fire_team_leader_parameters = params;
      break;
    }
    case ConditionType.player_assisted_with_kill: {
      const params = new s_condition_player_assisted_with_kill_parameters();
      params.m_player_1 = encodePlayerReference(condition.parameters.player1);
      params.m_player_2 = encodePlayerReference(condition.parameters.player2);
      target.m_player_assisted_with_kill_parameters = params;
      break;
    }
    case ConditionType.object_matches_filter: {
      const params = new s_condition_object_matches_filter_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      params.m_filter_index = condition.parameters.filterIndex;
      target.m_object_matches_filter_parameters = params;
      break;
    }
    case ConditionType.player_is_active: {
      const params = new s_condition_player_is_active_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_active_parameters = params;
      break;
    }
    case ConditionType.equipment_is_active: {
      const params = new s_condition_equipment_is_active_parameters();
      params.m_object = encodeObjectReference(condition.parameters.object);
      target.m_equipment_is_active_parameters = params;
      break;
    }
    case ConditionType.player_is_spartan: {
      const params = new s_condition_player_is_spartan_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_spartan_parameters = params;
      break;
    }
    case ConditionType.player_is_elite: {
      const params = new s_condition_player_is_elite_parameters();
      params.m_player = encodePlayerReference(condition.parameters.player);
      target.m_player_is_elite_parameters = params;
      break;
    }
    case ConditionType.player_is_editor: {
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
