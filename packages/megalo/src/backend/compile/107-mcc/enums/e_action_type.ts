import { e_action_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  ActionType,
  type ActionType as ActionTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";

const ACTION_TYPE_TO_BLF = {
  [ActionType.set_score]: e_action_type.set_score,
  [ActionType.create_object]: e_action_type.create_object,
  [ActionType.delete_object]: e_action_type.delete_object,
  [ActionType.navpoint_set_visible]: e_action_type.navpoint_set_visible,
  [ActionType.navpoint_set_icon]: e_action_type.navpoint_set_icon,
  [ActionType.navpoint_set_priority]: e_action_type.navpoint_set_priority,
  [ActionType.navpoint_set_timer]: e_action_type.navpoint_set_timer,
  [ActionType.navpoint_set_visible_range]:
    e_action_type.navpoint_set_visible_range,
  [ActionType.set]: e_action_type.set,
  [ActionType.set_boundary]: e_action_type.set_boundary,
  [ActionType.apply_player_traits]: e_action_type.apply_player_traits,
  [ActionType.set_pickup_filter]: e_action_type.set_pickup_filter,
  [ActionType.set_respawn_filter]: e_action_type.set_respawn_filter,
  [ActionType.set_fireteam_respawn_filter]:
    e_action_type.set_fireteam_respawn_filter,
  [ActionType.set_progress_bar]: e_action_type.set_progress_bar,
  [ActionType.hud_post_message]: e_action_type.hud_post_message,
  [ActionType.timer_set_rate]: e_action_type.timer_set_rate,
  [ActionType.print_variable]: e_action_type.print_variable,
  [ActionType.get_player_holding_object]:
    e_action_type.get_player_holding_object,
  [ActionType.for_each]: e_action_type.for_each,
  [ActionType.end_round]: e_action_type.end_round,
  [ActionType.boundary_set_visible]: e_action_type.boundary_set_visible,
  [ActionType.object_destroy]: e_action_type.object_destroy,
  [ActionType.object_set_invincibility]: e_action_type.object_set_invincibility,
  [ActionType.random]: e_action_type.random,
  [ActionType.break_into_debugger]: e_action_type.break_into_debugger,
  [ActionType.object_get_orientation]: e_action_type.object_get_orientation,
  [ActionType.object_get_velocity]: e_action_type.object_get_velocity,
  [ActionType.player_death_get_killing_player]:
    e_action_type.player_death_get_killing_player,
  [ActionType.player_death_get_damage_type]:
    e_action_type.player_death_get_damage_type,
  [ActionType.player_death_get_special_type]:
    e_action_type.player_death_get_special_type,
  [ActionType.debugging_enable_tracing]: e_action_type.debugging_enable_tracing,
  [ActionType.object_attach]: e_action_type.object_attach,
  [ActionType.object_detach]: e_action_type.object_detach,
  [ActionType.player_get_place]: e_action_type.player_get_place,
  [ActionType.team_get_place]: e_action_type.team_get_place,
  [ActionType.player_get_killing_spree_count]:
    e_action_type.player_get_killing_spree_count,
  [ActionType.player_adjust_money]: e_action_type.player_adjust_money,
  [ActionType.player_enable_purchases]: e_action_type.player_enable_purchases,
  [ActionType.player_get_vehicle]: e_action_type.player_get_vehicle,
  [ActionType.player_set_vehicle]: e_action_type.player_set_vehicle,
  [ActionType.player_set_unit]: e_action_type.player_set_unit,
  [ActionType.timer_reset]: e_action_type.timer_reset,
  [ActionType.weapon_set_pickup_priority]:
    e_action_type.weapon_set_pickup_priority,
  [ActionType.object_bounce]: e_action_type.object_bounce,
  [ActionType.hud_widget_set_text]: e_action_type.hud_widget_set_text,
  [ActionType.hud_widget_set_value]: e_action_type.hud_widget_set_value,
  [ActionType.hud_widget_set_meter]: e_action_type.hud_widget_set_meter,
  [ActionType.hud_widget_set_icon]: e_action_type.hud_widget_set_icon,
  [ActionType.hud_widget_set_visibility]:
    e_action_type.hud_widget_set_visibility,
  [ActionType.play_sound]: e_action_type.play_sound,
  [ActionType.object_set_scale]: e_action_type.object_set_scale,
  [ActionType.navpoint_set_text]: e_action_type.navpoint_set_text,
  [ActionType.object_get_shield]: e_action_type.object_get_shield,
  [ActionType.object_get_health]: e_action_type.object_get_health,
  [ActionType.player_set_objective]: e_action_type.player_set_objective,
  [ActionType.player_set_objective_allegiance]:
    e_action_type.player_set_objective_allegiance,
  [ActionType.player_set_objective_allegiance_icon]:
    e_action_type.player_set_objective_allegiance_icon,
  [ActionType.team_set_coop_spawning]: e_action_type.team_set_coop_spawning,
  [ActionType.team_set_primary_respawn_object]:
    e_action_type.team_set_primary_respawn_object,
  [ActionType.player_set_primary_respawn_object]:
    e_action_type.player_set_primary_respawn_object,
  [ActionType.player_get_fireteam_index]:
    e_action_type.player_get_fireteam_index,
  [ActionType.player_set_fireteam_index]:
    e_action_type.player_set_fireteam_index,
  [ActionType.object_adjust_shield]: e_action_type.object_adjust_shield,
  [ActionType.object_adjust_health]: e_action_type.object_adjust_health,
  [ActionType.object_get_distance]: e_action_type.object_get_distance,
  [ActionType.object_adjust_maximum_shield]:
    e_action_type.object_adjust_maximum_shield,
  [ActionType.object_adjust_maximum_health]:
    e_action_type.object_adjust_maximum_health,
  [ActionType.player_set_requisition_palette]:
    e_action_type.player_set_requisition_palette,
  [ActionType.device_set_power]: e_action_type.device_set_power,
  [ActionType.device_get_power]: e_action_type.device_get_power,
  [ActionType.device_set_position]: e_action_type.device_set_position,
  [ActionType.device_get_position]: e_action_type.device_get_position,
  [ActionType.adjust_grenades]: e_action_type.adjust_grenades,
  [ActionType.submit_incident]: e_action_type.submit_incident,
  [ActionType.submit_incident_with_custom_value]:
    e_action_type.submit_incident_with_custom_value,
  [ActionType.set_loadout_palette]: e_action_type.set_loadout_palette,
  [ActionType.device_set_position_track]:
    e_action_type.device_set_position_track,
  [ActionType.device_animate_position]: e_action_type.device_animate_position,
  [ActionType.device_set_position_immediate]:
    e_action_type.device_set_position_immediate,
  [ActionType.saved_film_insert_marker]: e_action_type.saved_film_insert_marker,
  [ActionType.respawn_zone_enable]: e_action_type.respawn_zone_enable,
  [ActionType.player_get_weapon]: e_action_type.player_get_weapon,
  [ActionType.player_get_equipment]: e_action_type.player_get_equipment,
  [ActionType.object_set_never_garbage]: e_action_type.object_set_never_garbage,
  [ActionType.player_get_target_object]: e_action_type.player_get_target_object,
  [ActionType.create_tunnel]: e_action_type.create_tunnel,
  [ActionType.debug_force_player_view_count]:
    e_action_type.debug_force_player_view_count,
  [ActionType.player_pick_up_weapon]: e_action_type.player_pick_up_weapon,
  [ActionType.player_set_coop_spawning]: e_action_type.player_set_coop_spawning,
  [ActionType.object_set_orientation]: e_action_type.object_set_orientation,
  [ActionType.object_face_object]: e_action_type.object_face_object,
  [ActionType.biped_give_weapon]: e_action_type.biped_give_weapon,
  [ActionType.biped_drop_weapon]: e_action_type.biped_drop_weapon,
  [ActionType.set_scenario_interpolator_state]:
    e_action_type.set_scenario_interpolator_state,
  [ActionType.get_random_object]: e_action_type.get_random_object,
  [ActionType.game_grief_record_custom_penalty]:
    e_action_type.game_grief_record_custom_penalty,
  [ActionType.boundary_set_player_color]:
    e_action_type.boundary_set_player_color,
  [ActionType.begin]: e_action_type.begin,
  [ActionType.hs_function_call]: e_action_type.hs_function_call,
  [ActionType.get_button_time]: e_action_type.get_button_time,
  [ActionType.team_set_vehicle_spawning]:
    e_action_type.team_set_vehicle_spawning,
  [ActionType.player_set_vehicle_spawning]:
    e_action_type.player_set_vehicle_spawning,
  [ActionType.set_player_respawn_vehicle]:
    e_action_type.set_player_respawn_vehicle,
  [ActionType.set_team_respawn_vehicle]: e_action_type.set_team_respawn_vehicle,
  [ActionType.hide_object]: e_action_type.hide_object,
} as const satisfies Record<ActionTypeName, e_action_type>;

export const encodeActionType = (value: ActionTypeName): e_action_type =>
  mapMegaloEnum(value, ACTION_TYPE_TO_BLF);
