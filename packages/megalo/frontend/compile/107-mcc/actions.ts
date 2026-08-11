import {
  type c_game_engine_custom_variant,
  c_action,
  e_biped_give_weapon_mode,
  e_chud_navpoint_icon_type,
  e_game_engine_timer_rate,
  e_grenade_type,
  e_megalo_sound,
  e_navpoint_priority,
  e_scriptable_game_buttons,
  e_weapon_pickup_priority,
  s_action_adjust_grenades_parameters,
  s_action_apply_player_traits_parameters,
  s_action_begin_parameters,
  s_action_biped_drop_weapon_parameters,
  s_action_biped_give_weapon_parameters,
  s_action_boundary_set_player_color_parameters,
  s_action_boundary_set_visible_parameters,
  s_action_break_into_debugger_parameters,
  s_action_create_object_parameters,
  s_action_create_tunnel_parameters,
  s_action_debug_force_player_view_count_parameters,
  s_action_debugging_enable_tracing_parameters,
  s_action_delete_object_parameters,
  s_action_device_animate_position_parameters,
  s_action_device_get_position_parameters,
  s_action_device_get_power_parameters,
  s_action_device_set_position_immediate_parameters,
  s_action_device_set_position_parameters,
  s_action_device_set_position_track_parameters,
  s_action_device_set_power_parameters,
  s_action_end_round_parameters,
  s_action_for_each_parameters,
  s_action_game_grief_record_custom_penalty_parameters,
  s_action_get_button_time_parameters,
  s_action_get_player_holding_object_parameters,
  s_action_get_random_object_parameters,
  s_action_hide_object_parameters,
  s_action_hs_function_call_parameters,
  s_action_hud_post_message_parameters,
  s_action_hud_widget_set_icon_parameters,
  s_action_hud_widget_set_meter_parameters,
  s_action_hud_widget_set_text_parameters,
  s_action_hud_widget_set_value_parameters,
  s_action_hud_widget_set_visibility_parameters,
  s_action_navpoint_set_icon_parameters,
  s_action_navpoint_set_priority_parameters,
  s_action_navpoint_set_text_parameters,
  s_action_navpoint_set_timer_parameters,
  s_action_navpoint_set_visible_parameters,
  s_action_navpoint_set_visible_range_parameters,
  s_action_object_adjust_health_parameters,
  s_action_object_adjust_maximum_health_parameters,
  s_action_object_adjust_maximum_shield_parameters,
  s_action_object_adjust_shield_parameters,
  s_action_object_attach_parameters,
  s_action_object_bounce_parameters,
  s_action_object_destroy_parameters,
  s_action_object_detach_parameters,
  s_action_object_face_object_parameters,
  s_action_object_get_distance_parameters,
  s_action_object_get_health_parameters,
  s_action_object_get_orientation_parameters,
  s_action_object_get_shield_parameters,
  s_action_object_get_velocity_parameters,
  s_action_object_set_invincibility_parameters,
  s_action_object_set_never_garbage_parameters,
  s_action_object_set_orientation_parameters,
  s_action_object_set_scale_parameters,
  s_action_play_sound_parameters,
  s_action_player_adjust_money_parameters,
  s_action_player_death_get_damage_type_parameters,
  s_action_player_death_get_killing_player_parameters,
  s_action_player_death_get_special_type_parameters,
  s_action_player_enable_purchases_parameters,
  s_action_player_get_equipment_parameters,
  s_action_player_get_fireteam_index_parameters,
  s_action_player_get_killing_spree_count_parameters,
  s_action_player_get_place_parameters,
  s_action_player_get_target_object_parameters,
  s_action_player_get_vehicle_parameters,
  s_action_player_get_weapon_parameters,
  s_action_player_pick_up_weapon_parameters,
  s_action_player_set_coop_spawning_parameters,
  s_action_player_set_fireteam_index_parameters,
  s_action_player_set_objective_allegiance_icon_parameters,
  s_action_player_set_objective_allegiance_parameters,
  s_action_player_set_objective_parameters,
  s_action_player_set_primary_respawn_object_parameters,
  s_action_player_set_requisition_palette_parameters,
  s_action_player_set_unit_parameters,
  s_action_player_set_vehicle_parameters,
  s_action_player_set_vehicle_spawning_parameters,
  s_action_print_variable_parameters,
  s_action_random_parameters,
  s_action_respawn_zone_enable_parameters,
  s_action_saved_film_insert_marker_parameters,
  s_action_set_boundary_parameters,
  s_action_set_fireteam_respawn_filter_parameters,
  s_action_set_loadout_palette_parameters,
  s_action_set_parameters,
  s_action_set_pickup_filter_parameters,
  s_action_set_player_respawn_vehicle_parameters,
  s_action_set_progress_bar_parameters,
  s_action_set_respawn_filter_parameters,
  s_action_set_scenario_interpolator_state_parameters,
  s_action_set_score_parameters,
  s_action_set_team_respawn_vehicle_parameters,
  s_action_submit_incident_parameters,
  s_action_submit_incident_with_custom_value_parameters,
  s_action_team_get_place_parameters,
  s_action_team_set_coop_spawning_parameters,
  s_action_team_set_primary_respawn_object_parameters,
  s_action_team_set_vehicle_spawning_parameters,
  s_action_timer_reset_parameters,
  s_action_timer_set_rate_parameters,
  s_action_weapon_set_pickup_priority_parameters,
  e_fireteam_filter_flags,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { Diagnostics } from "../../diagnostics";
import type { IR } from "../../intermediate-representation";
import {
  ActionType,
  BoundaryShape,
  type Action,
  type FireteamFilter,
  type SetBoundaryParameters,
} from "../../intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ObjectTypeReference } from "../../intermediate-representation/game/megalogamengine/megalogamengine_references";
import { encodeActionType } from "./enums/e_action_type";
import { encodeMathOperation } from "./enums/e_math_operation";
import {
  encodeBoundaryShape,
  encodeCreateObjectFlags,
  encodeCustomTimerReference,
  encodeCustomVariableReference,
  encodeDynamicString,
  encodeHudMeterInput,
  encodeObjectOffset,
  encodeObjectReference,
  encodeObjectTypeReference,
  encodePlayerFilterModifier,
  encodePlayerPurchaseModeFlags,
  encodePlayerReference,
  encodeTeamOrPlayerTarget,
  encodeTeamReference,
  encodeVariantVariable,
} from "./references";
const encodeFireteamFilter = (value: FireteamFilter): e_fireteam_filter_flags => {
  const flags = new e_fireteam_filter_flags();
  flags.fireteam1 = value.fireteam1;
  flags.fireteam2 = value.fireteam2;
  flags.fireteam3 = value.fireteam3;
  flags.fireteam4 = value.fireteam4;
  flags.fireteam5 = value.fireteam5;
  flags.fireteam6 = value.fireteam6;
  flags.fireteam7 = value.fireteam7;
  flags.fireteam8 = value.fireteam8;
  return flags;
};
const assignSetBoundaryParameters = (
  params: s_action_set_boundary_parameters,
  boundary: SetBoundaryParameters
): void => {
  params.m_object = encodeObjectReference(boundary.object);
  params.m_shape = encodeBoundaryShape(boundary.shape) as typeof params.m_shape;
  switch (boundary.shape) {
    case BoundaryShape.Sphere:
      params.m_variable_1 = encodeCustomVariableReference(boundary.radius);
      break;
    case BoundaryShape.Box:
      params.m_variable_1 = encodeCustomVariableReference(boundary.width);
      params.m_variable_2 = encodeCustomVariableReference(boundary.depth);
      params.m_variable_3 = encodeCustomVariableReference(boundary.height);
      params.m_variable_4 = encodeCustomVariableReference(boundary.height);
      break;
    case BoundaryShape.Cylinder:
      params.m_variable_1 = encodeCustomVariableReference(boundary.radius);
      params.m_variable_2 = encodeCustomVariableReference(boundary.height);
      params.m_variable_3 = encodeCustomVariableReference(boundary.height);
      break;
    default: {
      const _exhaustive: never = boundary;
      return _exhaustive;
    }
  }
};
const compileAction = (_action: Action, _diagnostics: Diagnostics): c_action => {
  const action = _action;
  const target = new c_action();
  target.m_type = encodeActionType(action.type);
  switch (action.type) {
    case ActionType.SetScore: {
      const params = new s_action_set_score_parameters();
      params.m_target = encodeTeamOrPlayerTarget(action.parameters.target);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.variable);
      target.m_set_score_parameters = params;
      break;
    }
    case ActionType.CreateObject: {
      const params = new s_action_create_object_parameters();
      params.m_object_type = encodeObjectTypeReference(action.parameters.objectType);
      params.m_object_reference_1 = encodeObjectReference(
        action.parameters.place_at_object
      );
      if (action.parameters.object_reference_out !== undefined) {
        params.m_object_reference_2 = encodeObjectReference(
          action.parameters.object_reference_out
        );
      }
      params.m_filter_index = action.parameters.labelIndex ?? 0;
      params.m_flags = encodeCreateObjectFlags(action.parameters);
      params.m_offset = encodeObjectOffset(action.parameters.offset ?? { x: 0, y: 0, z: 0 });
      params.m_variant_name_index = action.parameters.variantNameIndex ?? 0;
      target.m_create_object_parameters = params;
      break;
    }
    case ActionType.DeleteObject: {
      const params = new s_action_delete_object_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      target.m_delete_object_parameters = params;
      break;
    }
    case ActionType.NavpointSetVisible: {
      const params = new s_action_navpoint_set_visible_parameters();
      params.m_object = encodeObjectReference(action.parameters.navpoint);
      params.m_player_filter_modifier = encodePlayerFilterModifier(
        action.parameters.playerFilterModifier
      );
      target.m_navpoint_set_visible_parameters = params;
      break;
    }
    case ActionType.NavpointSetIcon: {
      const params = new s_action_navpoint_set_icon_parameters();
      params.m_object = encodeObjectReference(action.parameters.navpoint);
      params.m_navpoint_icon = Number(
        action.parameters.icon
      ) as unknown as e_chud_navpoint_icon_type;
      target.m_navpoint_set_icon_parameters = params;
      break;
    }
    case ActionType.NavpointSetPriority: {
      const params = new s_action_navpoint_set_priority_parameters();
      params.m_object = encodeObjectReference(action.parameters.navpoint);
      params.m_priority = action.parameters
        .priority as unknown as e_navpoint_priority;
      target.m_navpoint_set_priority_parameters = params;
      break;
    }
    case ActionType.NavpointSetTimer: {
      const params = new s_action_navpoint_set_timer_parameters();
      params.m_object = encodeObjectReference(action.parameters.navpoint);
      params.m_timer_index = action.parameters.timerIndex;
      target.m_navpoint_set_timer_parameters = params;
      break;
    }
    case ActionType.NavpointSetVisibleRange: {
      const params = new s_action_navpoint_set_visible_range_parameters();
      params.m_object = encodeObjectReference(action.parameters.navpoint);
      params.m_variable_1 = encodeCustomVariableReference(
        action.parameters.minFeet
      );
      params.m_variable_2 = encodeCustomVariableReference(
        action.parameters.maxFeet
      );
      target.m_navpoint_set_visible_range_parameters = params;
      break;
    }
    case ActionType.Set: {
      const params = new s_action_set_parameters();
      params.m_variable_1 = encodeVariantVariable(action.parameters.left);
      params.m_variable_2 = encodeVariantVariable(action.parameters.right);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      target.m_set_parameters = params;
      break;
    }
    case ActionType.SetBoundary: {
      const params = new s_action_set_boundary_parameters();
      assignSetBoundaryParameters(params, action.parameters);
      target.m_set_boundary_parameters = params;
      break;
    }
    case ActionType.ApplyPlayerTraits: {
      const params = new s_action_apply_player_traits_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_trait_index = action.parameters.traitIndex;
      target.m_apply_player_traits_parameters = params;
      break;
    }
    case ActionType.SetPickupFilter: {
      const params = new s_action_set_pickup_filter_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player_filter_modifier = encodePlayerFilterModifier(
        action.parameters.playerFilterModifier
      );
      target.m_set_pickup_filter_parameters = params;
      break;
    }
    case ActionType.SetRespawnFilter: {
      const params = new s_action_set_respawn_filter_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player_filter_modifier = encodePlayerFilterModifier(
        action.parameters.playerFilterModifier
      );
      target.m_set_respawn_filter_parameters = params;
      break;
    }
    case ActionType.SetFireteamRespawnFilter: {
      const params = new s_action_set_fireteam_respawn_filter_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_fireteam_filter = encodeFireteamFilter(
        action.parameters.fireteamFilter
      );
      target.m_set_fireteam_respawn_filter_parameters = params;
      break;
    }
    case ActionType.SetProgressBar: {
      const params = new s_action_set_progress_bar_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player_filter_modifier = encodePlayerFilterModifier(
        action.parameters.playerFilterModifier
      );
      params.m_timer_index = action.parameters.timerIndex;
      target.m_set_progress_bar_parameters = params;
      break;
    }
    case ActionType.HudPostMessage: {
      const params = new s_action_hud_post_message_parameters();
      params.m_target = encodeTeamOrPlayerTarget(action.parameters.target);
      params.m_sound_index = action.parameters
        .soundIndex as unknown as e_megalo_sound;
      params.m_string = encodeDynamicString(action.parameters.string);
      target.m_hud_post_message_parameters = params;
      break;
    }
    case ActionType.TimerSetRate: {
      const params = new s_action_timer_set_rate_parameters();
      params.m_timer = encodeCustomTimerReference(action.parameters.timer);
      params.m_rate = action.parameters.rate as unknown as e_game_engine_timer_rate;
      target.m_timer_set_rate_parameters = params;
      break;
    }
    case ActionType.PrintVariable: {
      const params = new s_action_print_variable_parameters();
      params.m_string = encodeDynamicString(action.parameters.string);
      target.m_print_variable_parameters = params;
      break;
    }
    case ActionType.GetPlayerHoldingObject: {
      const params = new s_action_get_player_holding_object_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player = encodePlayerReference(action.parameters.playerOut);
      target.m_get_player_holding_object_parameters = params;
      break;
    }
    case ActionType.ForEach: {
      const params = new s_action_for_each_parameters();
      params.m_trigger_index = action.parameters.triggerIndex;
      target.m_for_each_parameters = params;
      break;
    }
    case ActionType.EndRound: {
      target.m_end_round_parameters = new s_action_end_round_parameters();
      break;
    }
    case ActionType.BoundarySetVisible: {
      const params = new s_action_boundary_set_visible_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player_filter_modifier = encodePlayerFilterModifier(
        action.parameters.playerFilterModifier
      );
      target.m_boundary_set_visible_parameters = params;
      break;
    }
    case ActionType.ObjectDestroy: {
      const params = new s_action_object_destroy_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_no_statistics = action.parameters.noStatistics ?? false;
      target.m_object_destroy_parameters = params;
      break;
    }
    case ActionType.ObjectSetInvincibility: {
      const params = new s_action_object_set_invincibility_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.invincible
      );
      target.m_object_set_invincibility_parameters = params;
      break;
    }
    case ActionType.Random: {
      const params = new s_action_random_parameters();
      params.m_variable_1 = encodeCustomVariableReference(
        action.parameters.range
      );
      params.m_variable_2 = encodeCustomVariableReference(
        action.parameters.valueOut
      );
      target.m_random_parameters = params;
      break;
    }
    case ActionType.BreakIntoDebugger: {
      target.m_break_into_debugger_parameters =
        new s_action_break_into_debugger_parameters();
      break;
    }
    case ActionType.ObjectGetOrientation: {
      const params = new s_action_object_get_orientation_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.orientationOut
      );
      target.m_object_get_orientation_parameters = params;
      break;
    }
    case ActionType.ObjectGetVelocity: {
      const params = new s_action_object_get_velocity_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.velocityOut
      );
      target.m_object_get_velocity_parameters = params;
      break;
    }
    case ActionType.PlayerDeathGetKillingPlayer: {
      const params = new s_action_player_death_get_killing_player_parameters();
      params.m_player_1 = encodePlayerReference(action.parameters.deadPlayer);
      params.m_player_2 = encodePlayerReference(
        action.parameters.killingPlayerOut
      );
      target.m_player_death_get_killing_player_parameters = params;
      break;
    }
    case ActionType.PlayerDeathGetDamageType: {
      const params = new s_action_player_death_get_damage_type_parameters();
      params.m_player = encodePlayerReference(action.parameters.deadPlayer);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.damageTypeOut
      );
      target.m_player_death_get_damage_type_parameters = params;
      break;
    }
    case ActionType.PlayerDeathGetSpecialType: {
      const params = new s_action_player_death_get_special_type_parameters();
      params.m_player = encodePlayerReference(action.parameters.deadPlayer);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.specialTypeOut
      );
      target.m_player_death_get_special_type_parameters = params;
      break;
    }
    case ActionType.DebuggingEnableTracing: {
      const params = new s_action_debugging_enable_tracing_parameters();
      params.m_tracing_enabled = action.parameters.tracingEnabled;
      target.m_debugging_enable_tracing_parameters = params;
      break;
    }
    case ActionType.ObjectAttach: {
      const params = new s_action_object_attach_parameters();
      params.m_object_1 = encodeObjectReference(action.parameters.child);
      params.m_object_2 = encodeObjectReference(action.parameters.parent);
      params.m_offset = encodeObjectOffset(action.parameters.offset);
      params.m_absolute_orientation = action.parameters.absoluteOrientation ?? false;
      target.m_object_attach_parameters = params;
      break;
    }
    case ActionType.ObjectDetach: {
      const params = new s_action_object_detach_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      target.m_object_detach_parameters = params;
      break;
    }
    case ActionType.PlayerGetPlace: {
      const params = new s_action_player_get_place_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(action.parameters.placeOut);
      target.m_player_get_place_parameters = params;
      break;
    }
    case ActionType.TeamGetPlace: {
      const params = new s_action_team_get_place_parameters();
      params.m_team = encodeTeamReference(action.parameters.team);
      params.m_variable = encodeCustomVariableReference(action.parameters.placeOut);
      target.m_team_get_place_parameters = params;
      break;
    }
    case ActionType.PlayerGetKillingSpreeCount: {
      const params = new s_action_player_get_killing_spree_count_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.spreeCountOut
      );
      target.m_player_get_killing_spree_count_parameters = params;
      break;
    }
    case ActionType.PlayerAdjustMoney: {
      const params = new s_action_player_adjust_money_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_math_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_player_adjust_money_parameters = params;
      break;
    }
    case ActionType.PlayerEnablePurchases: {
      const params = new s_action_player_enable_purchases_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(action.parameters.enabled);
      params.m_mode = encodePlayerPurchaseModeFlags(action.parameters.selectedModes);
      target.m_player_enable_purchases_parameters = params;
      break;
    }
    case ActionType.PlayerGetVehicle: {
      const params = new s_action_player_get_vehicle_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.vehicleOut);
      target.m_player_get_vehicle_parameters = params;
      break;
    }
    case ActionType.PlayerSetVehicle: {
      const params = new s_action_player_set_vehicle_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.vehicle);
      target.m_player_set_vehicle_parameters = params;
      break;
    }
    case ActionType.PlayerSetUnit: {
      const params = new s_action_player_set_unit_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.unit);
      target.m_player_set_unit_parameters = params;
      break;
    }
    case ActionType.TimerReset: {
      const params = new s_action_timer_reset_parameters();
      params.m_timer = encodeCustomTimerReference(action.parameters.timer);
      target.m_timer_reset_parameters = params;
      break;
    }
    case ActionType.WeaponSetPickupPriority: {
      const params = new s_action_weapon_set_pickup_priority_parameters();
      params.m_object = encodeObjectReference(action.parameters.weapon);
      params.m_weapon_pickup_priority = action.parameters
        .priority as unknown as e_weapon_pickup_priority;
      target.m_weapon_set_pickup_priority_parameters = params;
      break;
    }
    case ActionType.ObjectBounce: {
      const params = new s_action_object_bounce_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      target.m_object_bounce_parameters = params;
      break;
    }
    case ActionType.HudWidgetSetText: {
      const params = new s_action_hud_widget_set_text_parameters();
      params.m_widget_index = action.parameters.widgetIndex;
      params.m_string = encodeDynamicString(action.parameters.string);
      target.m_hud_widget_set_text_parameters = params;
      break;
    }
    case ActionType.HudWidgetSetValue: {
      const params = new s_action_hud_widget_set_value_parameters();
      params.m_widget_index = action.parameters.widgetIndex;
      params.m_string = encodeDynamicString(action.parameters.value);
      target.m_hud_widget_set_value_parameters = params;
      break;
    }
    case ActionType.HudWidgetSetMeter: {
      const params = new s_action_hud_widget_set_meter_parameters();
      params.m_widget_index = action.parameters.widgetIndex;
      params.m_meter_input = encodeHudMeterInput(action.parameters.meterInput);
      target.m_hud_widget_set_meter_parameters = params;
      break;
    }
    case ActionType.HudWidgetSetIcon: {
      const params = new s_action_hud_widget_set_icon_parameters();
      params.m_widget_index = action.parameters.widgetIndex;
      params.m_icon_index = action.parameters.iconIndex;
      target.m_hud_widget_set_icon_parameters = params;
      break;
    }
    case ActionType.HudWidgetSetVisibility: {
      const params = new s_action_hud_widget_set_visibility_parameters();
      params.m_widget_index = action.parameters.widgetIndex;
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_visible = action.parameters.visible;
      target.m_hud_widget_set_visibility_parameters = params;
      break;
    }
    case ActionType.PlaySound: {
      const params = new s_action_play_sound_parameters();
      params.m_sound_index = action.parameters
        .soundIndex as unknown as e_megalo_sound;
      params.m_immediate = action.parameters.immediate;
      params.m_target = encodeTeamOrPlayerTarget(action.parameters.target);
      target.m_play_sound_parameters = params;
      break;
    }
    case ActionType.ObjectSetScale: {
      const params = new s_action_object_set_scale_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.scale);
      target.m_object_set_scale_parameters = params;
      break;
    }
    case ActionType.NavpointSetText: {
      const params = new s_action_navpoint_set_text_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_string = encodeDynamicString(action.parameters.string);
      target.m_navpoint_set_text_parameters = params;
      break;
    }
    case ActionType.ObjectGetShield: {
      const params = new s_action_object_get_shield_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.variable);
      target.m_object_get_shield_parameters = params;
      break;
    }
    case ActionType.ObjectGetHealth: {
      const params = new s_action_object_get_health_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.variable);
      target.m_object_get_health_parameters = params;
      break;
    }
    case ActionType.PlayerSetObjective: {
      const params = new s_action_player_set_objective_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_string = encodeDynamicString(action.parameters.objective);
      target.m_player_set_objective_parameters = params;
      break;
    }
    case ActionType.PlayerSetObjectiveAllegiance: {
      const params = new s_action_player_set_objective_allegiance_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_string = encodeDynamicString(action.parameters.allegiance);
      target.m_player_set_objective_allegiance_parameters = params;
      break;
    }
    case ActionType.PlayerSetObjectiveAllegianceIcon: {
      const params =
        new s_action_player_set_objective_allegiance_icon_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_icon_index = action.parameters.iconIndex;
      target.m_player_set_objective_allegiance_icon_parameters = params;
      break;
    }
    case ActionType.TeamSetCoopSpawning: {
      const params = new s_action_team_set_coop_spawning_parameters();
      params.m_team = encodeTeamReference(action.parameters.team);
      params.m_enabled = action.parameters.coopSpawningEnabled;
      target.m_team_set_coop_spawning_parameters = params;
      break;
    }
    case ActionType.TeamSetPrimaryRespawnObject: {
      const params = new s_action_team_set_primary_respawn_object_parameters();
      params.m_team = encodeTeamReference(action.parameters.team);
      params.m_object = encodeObjectReference(action.parameters.respawnObject);
      target.m_team_set_primary_respawn_object_parameters = params;
      break;
    }
    case ActionType.PlayerSetPrimaryRespawnObject: {
      const params = new s_action_player_set_primary_respawn_object_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.respawnObject);
      target.m_player_set_primary_respawn_object_parameters = params;
      break;
    }
    case ActionType.PlayerGetFireteamIndex: {
      const params = new s_action_player_get_fireteam_index_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.fireteamIndexOut
      );
      target.m_player_get_fireteam_index_parameters = params;
      break;
    }
    case ActionType.PlayerSetFireteamIndex: {
      const params = new s_action_player_set_fireteam_index_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.fireteamIndex
      );
      target.m_player_set_fireteam_index_parameters = params;
      break;
    }
    case ActionType.ObjectAdjustShield: {
      const params = new s_action_object_adjust_shield_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_object_adjust_shield_parameters = params;
      break;
    }
    case ActionType.ObjectAdjustHealth: {
      const params = new s_action_object_adjust_health_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_object_adjust_health_parameters = params;
      break;
    }
    case ActionType.ObjectGetDistance: {
      const params = new s_action_object_get_distance_parameters();
      params.m_object_1 = encodeObjectReference(action.parameters.from);
      params.m_object_2 = encodeObjectReference(action.parameters.to);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.distanceOut
      );
      target.m_object_get_distance_parameters = params;
      break;
    }
    case ActionType.ObjectAdjustMaximumShield: {
      const params = new s_action_object_adjust_maximum_shield_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_object_adjust_maximum_shield_parameters = params;
      break;
    }
    case ActionType.ObjectAdjustMaximumHealth: {
      const params = new s_action_object_adjust_maximum_health_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_object_adjust_maximum_health_parameters = params;
      break;
    }
    case ActionType.PlayerSetRequisitionPalette: {
      const params = new s_action_player_set_requisition_palette_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_new_palette = action.parameters.requisitionPaletteIndex;
      target.m_player_set_requisition_palette_parameters = params;
      break;
    }
    case ActionType.DeviceSetPower: {
      const params = new s_action_device_set_power_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.power);
      target.m_device_set_power_parameters = params;
      break;
    }
    case ActionType.DeviceGetPower: {
      const params = new s_action_device_get_power_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.powerOut);
      target.m_device_get_power_parameters = params;
      break;
    }
    case ActionType.DeviceSetPosition: {
      const params = new s_action_device_set_position_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.position);
      target.m_device_set_position_parameters = params;
      break;
    }
    case ActionType.DeviceGetPosition: {
      const params = new s_action_device_get_position_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.positionOut
      );
      target.m_device_get_position_parameters = params;
      break;
    }
    case ActionType.AdjustGrenades: {
      const params = new s_action_adjust_grenades_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_grenade_type = action.parameters
        .grenadeType as unknown as e_grenade_type;
      params.m_math_operation = encodeMathOperation(action.parameters.operation);
      params.m_variable = encodeCustomVariableReference(action.parameters.amount);
      target.m_adjust_grenades_parameters = params;
      break;
    }
    case ActionType.SubmitIncident: {
      const params = new s_action_submit_incident_parameters();
      params.m_incident_id = action.parameters.statIndex;
      params.m_target_1 = encodeTeamOrPlayerTarget(action.parameters.cause);
      params.m_target_2 = encodeTeamOrPlayerTarget(action.parameters.effect);
      target.m_submit_incident_parameters = params;
      break;
    }
    case ActionType.SubmitIncidentWithCustomValue: {
      const params = new s_action_submit_incident_with_custom_value_parameters();
      params.m_incident_id = action.parameters.statIndex;
      params.m_target_1 = encodeTeamOrPlayerTarget(action.parameters.cause);
      params.m_target_2 = encodeTeamOrPlayerTarget(action.parameters.effect);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.customValue
      );
      target.m_submit_incident_with_custom_value_parameters = params;
      break;
    }
    case ActionType.SetLoadoutPalette: {
      const params = new s_action_set_loadout_palette_parameters();
      params.m_target = encodeTeamOrPlayerTarget(action.parameters.target);
      params.m_loadout_palette_index = action.parameters.loadoutPaletteIndex;
      target.m_set_loadout_palette_parameters = params;
      break;
    }
    case ActionType.DeviceSetPositionTrack: {
      const params = new s_action_device_set_position_track_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_animation_name_index = action.parameters.animationNameIndex;
      params.m_variable = encodeCustomVariableReference(
        action.parameters.interpolationTime
      );
      target.m_device_set_position_track_parameters = params;
      break;
    }
    case ActionType.DeviceAnimatePosition: {
      const params = new s_action_device_animate_position_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable_1 = encodeCustomVariableReference(
        action.parameters.animationTargetFraction
      );
      params.m_variable_2 = encodeCustomVariableReference(
        action.parameters.animationDurationSeconds
      );
      params.m_variable_3 = encodeCustomVariableReference(
        action.parameters.accelerationSeconds
      );
      params.m_variable_4 = encodeCustomVariableReference(
        action.parameters.decelerationSeconds
      );
      target.m_device_animate_position_parameters = params;
      break;
    }
    case ActionType.DeviceSetPositionImmediate: {
      const params = new s_action_device_set_position_immediate_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(action.parameters.position);
      target.m_device_set_position_immediate_parameters = params;
      break;
    }
    case ActionType.SavedFilmInsertMarker: {
      const params = new s_action_saved_film_insert_marker_parameters();
      params.m_variable = encodeCustomVariableReference(
        action.parameters.offsetSeconds
      );
      params.m_string = encodeDynamicString(action.parameters.label);
      target.m_saved_film_insert_marker_parameters = params;
      break;
    }
    case ActionType.RespawnZoneEnable: {
      const params = new s_action_respawn_zone_enable_parameters();
      params.m_object = encodeObjectReference(action.parameters.respawnZone);
      params.m_variable = encodeCustomVariableReference(action.parameters.enabled);
      target.m_respawn_zone_enable_parameters = params;
      break;
    }
    case ActionType.PlayerGetWeapon: {
      const params = new s_action_player_get_weapon_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_primary = action.parameters.primary;
      params.m_object = encodeObjectReference(action.parameters.weapon);
      target.m_player_get_weapon_parameters = params;
      break;
    }
    case ActionType.PlayerGetEquipment: {
      const params = new s_action_player_get_equipment_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.equipmentOut);
      target.m_player_get_equipment_parameters = params;
      break;
    }
    case ActionType.ObjectSetNeverGarbage: {
      const params = new s_action_object_set_never_garbage_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_variable = encodeCustomVariableReference(
        action.parameters.neverGarbage
      );
      target.m_object_set_never_garbage_parameters = params;
      break;
    }
    case ActionType.PlayerGetTargetObject: {
      const params = new s_action_player_get_target_object_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.objectOut);
      target.m_player_get_target_object_parameters = params;
      break;
    }
    case ActionType.CreateTunnel: {
      const params = new s_action_create_tunnel_parameters();
      params.m_object_1 = encodeObjectReference(
        action.parameters.from
      ) as unknown as typeof params.m_object_1;
      params.m_object_2 = encodeObjectReference(
        action.parameters.to
      ) as unknown as typeof params.m_object_2;
      params.m_object_type = encodeObjectTypeReference(
        action.parameters.objectType
      ) as unknown as typeof params.m_object_type;
      params.m_variable = encodeCustomVariableReference(action.parameters.radious);
      params.m_object_3 = encodeObjectReference(
        action.parameters.objectReferenceOut
      ) as unknown as typeof params.m_object_3;
      target.m_create_tunnel_parameters = params;
      break;
    }
    case ActionType.DebugForcePlayerViewCount: {
      const params = new s_action_debug_force_player_view_count_parameters();
      params.m_variable = encodeCustomVariableReference(
        action.parameters.viewCount
      );
      target.m_debug_force_player_view_count_parameters = params;
      break;
    }
    case ActionType.PlayerPickUpWeapon: {
      const params = new s_action_player_pick_up_weapon_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_object = encodeObjectReference(action.parameters.weapon);
      target.m_player_pick_up_weapon_parameters = params;
      break;
    }
    case ActionType.PlayerSetCoopSpawning: {
      const params = new s_action_player_set_coop_spawning_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_enabled = action.parameters.enabled;
      target.m_player_set_coop_spawning_parameters = params;
      break;
    }
    case ActionType.ObjectSetOrientation: {
      const params = new s_action_object_set_orientation_parameters();
      params.m_object_1 = encodeObjectReference(action.parameters.object);
      params.m_object_2 = encodeObjectReference(action.parameters.source);
      params.m_absolute_orientation = action.parameters.absoluteOrientation ?? false;
      target.m_object_set_orientation_parameters = params;
      break;
    }
    case ActionType.ObjectFaceObject: {
      const params = new s_action_object_face_object_parameters();
      params.m_object_1 = encodeObjectReference(action.parameters.object);
      params.m_object_2 = encodeObjectReference(action.parameters.target);
      params.m_offset = encodeObjectOffset(action.parameters.offset ?? { x: 0, y: 0, z: 0 });
      target.m_object_face_object_parameters = params;
      break;
    }
    case ActionType.BipedGiveWeapon: {
      const params = new s_action_biped_give_weapon_parameters();
      params.m_object = encodeObjectReference(action.parameters.biped);
      params.m_object_type = encodeObjectTypeReference(
        action.parameters.weapon as unknown as ObjectTypeReference
      );
      params.m_mode = action.parameters.mode as unknown as e_biped_give_weapon_mode;
      target.m_biped_give_weapon_parameters = params;
      break;
    }
    case ActionType.BipedDropWeapon: {
      const params = new s_action_biped_drop_weapon_parameters();
      params.m_object = encodeObjectReference(action.parameters.biped);
      params.m_primary = action.parameters.primary;
      params.m_delete_on_drop = action.parameters.deleteOnDrop;
      target.m_biped_drop_weapon_parameters = params;
      break;
    }
    case ActionType.SetScenarioInterpolatorState: {
      const params = new s_action_set_scenario_interpolator_state_parameters();
      params.m_variable_1 = encodeCustomVariableReference(
        action.parameters.interpolatorIndex
      );
      params.m_variable_2 = encodeCustomVariableReference(action.parameters.active);
      target.m_set_scenario_interpolator_state_parameters = params;
      break;
    }
    case ActionType.GetRandomObject: {
      const params = new s_action_get_random_object_parameters();
      params.m_object_1 = encodeObjectReference(action.parameters.ignoreObject);
      params.m_object_2 = encodeObjectReference(action.parameters.objectOut);
      params.m_filter_index = action.parameters.filterIndex;
      target.m_get_random_object_parameters = params;
      break;
    }
    case ActionType.GameGriefRecordCustomPenalty: {
      const params = new s_action_game_grief_record_custom_penalty_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_variable = encodeCustomVariableReference(action.parameters.variable);
      target.m_game_grief_record_custom_penalty_parameters = params;
      break;
    }
    case ActionType.BoundarySetPlayerColor: {
      const params = new s_action_boundary_set_player_color_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_player_index = action.parameters.playerIndex;
      target.m_boundary_set_player_color_parameters = params;
      break;
    }
    case ActionType.Begin: {
      const params = new s_action_begin_parameters();
      params.m_first_condition_index = action.parameters.firstConditionIndex;
      params.m_condition_count = action.parameters.conditionCount;
      params.m_first_action_index = action.parameters.firstActionIndex;
      params.m_action_count = action.parameters.actionCount;
      target.m_begin_parameters = params;
      break;
    }
    case ActionType.HsFunctionCall: {
      const params = new s_action_hs_function_call_parameters();
      params.m_function_name_index = action.parameters.functionNameIndex + 1;
      target.m_hs_function_call_parameters = params;
      break;
    }
    case ActionType.GetButtonTime: {
      const params = new s_action_get_button_time_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_buttons = action.parameters
        .button as unknown as e_scriptable_game_buttons;
      params.m_variable = encodeCustomVariableReference(action.parameters.timeOut);
      target.m_get_button_time_parameters = params;
      break;
    }
    case ActionType.TeamSetVehicleSpawning: {
      const params = new s_action_team_set_vehicle_spawning_parameters();
      params.m_team = encodeTeamReference(action.parameters.team);
      params.m_enabled = action.parameters.enabled;
      target.m_team_set_vehicle_spawning_parameters = params;
      break;
    }
    case ActionType.PlayerSetVehicleSpawning: {
      const params = new s_action_player_set_vehicle_spawning_parameters();
      params.m_player = encodePlayerReference(action.parameters.player);
      params.m_enabled = action.parameters.enabled;
      target.m_player_set_vehicle_spawning_parameters = params;
      break;
    }
    case ActionType.SetPlayerRespawnVehicle: {
      const params = new s_action_set_player_respawn_vehicle_parameters();
      params.m_object_type = encodeObjectTypeReference(action.parameters.objectType);
      params.m_player = encodePlayerReference(action.parameters.player);
      target.m_set_player_respawn_vehicle_parameters = params;
      break;
    }
    case ActionType.SetTeamRespawnVehicle: {
      const params = new s_action_set_team_respawn_vehicle_parameters();
      params.m_object_type = encodeObjectTypeReference(action.parameters.objectType);
      params.m_team = encodeTeamReference(action.parameters.team);
      target.m_set_team_respawn_vehicle_parameters = params;
      break;
    }
    case ActionType.HideObject: {
      const params = new s_action_hide_object_parameters();
      params.m_object = encodeObjectReference(action.parameters.object);
      params.m_should_hide = action.parameters.shouldHide;
      target.m_hide_object_parameters = params;
      break;
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
  return target;
};
export const compileActions = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  gameVariant.m_game_engine.m_actions = ir.gameVariant.gameEngine.actions.map(
    (action) => compileAction(action, diagnostics)
  );
};
