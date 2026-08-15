import { completeAdjustGrenades } from "src/language-service/completion/actions/adjust_grenades";
import { completeApplyPlayerTraits } from "src/language-service/completion/actions/apply_player_traits";
import { completeBipedDropWeapon } from "src/language-service/completion/actions/biped_drop_weapon";
import { completeBipedGiveWeapon } from "src/language-service/completion/actions/biped_give_weapon";
import { completeBoundarySetPlayerColor } from "src/language-service/completion/actions/boundary_set_player_color";
import { completeBoundarySetVisible } from "src/language-service/completion/actions/boundary_set_visible";
import { completeBreakIntoDebugger } from "src/language-service/completion/actions/break_into_debugger";
import { completeCreateObject } from "src/language-service/completion/actions/create_object";
import { completeCreateTunnel } from "src/language-service/completion/actions/create_tunnel";
import { completeDebugForcePlayerViewCount } from "src/language-service/completion/actions/debug_force_player_view_count";
import { completeDebuggingEnableTracing } from "src/language-service/completion/actions/debugging_enable_tracing";
import { completeDeleteObject } from "src/language-service/completion/actions/delete_object";
import { completeDeviceAnimatePosition } from "src/language-service/completion/actions/device_animate_position";
import { completeDeviceGetPosition } from "src/language-service/completion/actions/device_get_position";
import { completeDeviceGetPower } from "src/language-service/completion/actions/device_get_power";
import { completeDeviceSetPosition } from "src/language-service/completion/actions/device_set_position";
import { completeDeviceSetPositionImmediate } from "src/language-service/completion/actions/device_set_position_immediate";
import { completeDeviceSetPositionTrack } from "src/language-service/completion/actions/device_set_position_track";
import { completeDeviceSetPower } from "src/language-service/completion/actions/device_set_power";
import { completeEndRound } from "src/language-service/completion/actions/end_round";
import { completeForEach } from "src/language-service/completion/actions/for_each";
import { completeGameGriefRecordCustomPenalty } from "src/language-service/completion/actions/game_grief_record_custom_penalty";
import { completeGetButtonTime } from "src/language-service/completion/actions/get_button_time";
import { completeGetPlayerHoldingObject } from "src/language-service/completion/actions/get_player_holding_object";
import { completeGetRandomObject } from "src/language-service/completion/actions/get_random_object";
import { completeHideObject } from "src/language-service/completion/actions/hide_object";
import { completeHsFunctionCall } from "src/language-service/completion/actions/hs_function_call";
import { completeHudPostMessage } from "src/language-service/completion/actions/hud_post_message";
import { completeHudWidgetSetIcon } from "src/language-service/completion/actions/hud_widget_set_icon";
import { completeHudWidgetSetMeter } from "src/language-service/completion/actions/hud_widget_set_meter";
import { completeHudWidgetSetText } from "src/language-service/completion/actions/hud_widget_set_text";
import { completeHudWidgetSetValue } from "src/language-service/completion/actions/hud_widget_set_value";
import { completeHudWidgetSetVisibility } from "src/language-service/completion/actions/hud_widget_set_visibility";
import { completeNavpointSetIcon } from "src/language-service/completion/actions/navpoint_set_icon";
import { completeNavpointSetPriority } from "src/language-service/completion/actions/navpoint_set_priority";
import { completeNavpointSetText } from "src/language-service/completion/actions/navpoint_set_text";
import { completeNavpointSetTimer } from "src/language-service/completion/actions/navpoint_set_timer";
import { completeNavpointSetVisible } from "src/language-service/completion/actions/navpoint_set_visible";
import { completeNavpointSetVisibleRange } from "src/language-service/completion/actions/navpoint_set_visible_range";
import { completeObjectAdjustHealth } from "src/language-service/completion/actions/object_adjust_health";
import { completeObjectAdjustMaximumHealth } from "src/language-service/completion/actions/object_adjust_maximum_health";
import { completeObjectAdjustMaximumShield } from "src/language-service/completion/actions/object_adjust_maximum_shield";
import { completeObjectAdjustShield } from "src/language-service/completion/actions/object_adjust_shield";
import { completeObjectAttach } from "src/language-service/completion/actions/object_attach";
import { completeObjectBounce } from "src/language-service/completion/actions/object_bounce";
import { completeObjectDestroy } from "src/language-service/completion/actions/object_destroy";
import { completeObjectDetach } from "src/language-service/completion/actions/object_detach";
import { completeObjectFaceObject } from "src/language-service/completion/actions/object_face_object";
import { completeObjectGetDistance } from "src/language-service/completion/actions/object_get_distance";
import { completeObjectGetHealth } from "src/language-service/completion/actions/object_get_health";
import { completeObjectGetOrientation } from "src/language-service/completion/actions/object_get_orientation";
import { completeObjectGetShield } from "src/language-service/completion/actions/object_get_shield";
import { completeObjectGetVelocity } from "src/language-service/completion/actions/object_get_velocity";
import { completeObjectSetInvincibility } from "src/language-service/completion/actions/object_set_invincibility";
import { completeObjectSetNeverGarbage } from "src/language-service/completion/actions/object_set_never_garbage";
import { completeObjectSetOrientation } from "src/language-service/completion/actions/object_set_orientation";
import { completeObjectSetScale } from "src/language-service/completion/actions/object_set_scale";
import { completePlaySound } from "src/language-service/completion/actions/play_sound";
import { completePlayerAdjustMoney } from "src/language-service/completion/actions/player_adjust_money";
import { completePlayerDeathGetDamageType } from "src/language-service/completion/actions/player_death_get_damage_type";
import { completePlayerDeathGetKillingPlayer } from "src/language-service/completion/actions/player_death_get_killing_player";
import { completePlayerDeathGetSpecialType } from "src/language-service/completion/actions/player_death_get_special_type";
import { completePlayerEnablePurchases } from "src/language-service/completion/actions/player_enable_purchases";
import { completePlayerGetEquipment } from "src/language-service/completion/actions/player_get_equipment";
import { completePlayerGetFireteamIndex } from "src/language-service/completion/actions/player_get_fireteam_index";
import { completePlayerGetKillingSpreeCount } from "src/language-service/completion/actions/player_get_killing_spree_count";
import { completePlayerGetPlace } from "src/language-service/completion/actions/player_get_place";
import { completePlayerGetTargetObject } from "src/language-service/completion/actions/player_get_target_object";
import { completePlayerGetVehicle } from "src/language-service/completion/actions/player_get_vehicle";
import { completePlayerGetWeapon } from "src/language-service/completion/actions/player_get_weapon";
import { completePlayerPickUpWeapon } from "src/language-service/completion/actions/player_pick_up_weapon";
import { completePlayerSetCoopSpawning } from "src/language-service/completion/actions/player_set_coop_spawning";
import { completePlayerSetFireteamIndex } from "src/language-service/completion/actions/player_set_fireteam_index";
import { completePlayerSetObjective } from "src/language-service/completion/actions/player_set_objective";
import { completePlayerSetObjectiveAllegiance } from "src/language-service/completion/actions/player_set_objective_allegiance";
import { completePlayerSetObjectiveAllegianceIcon } from "src/language-service/completion/actions/player_set_objective_allegiance_icon";
import { completePlayerSetPrimaryRespawnObject } from "src/language-service/completion/actions/player_set_primary_respawn_object";
import { completePlayerSetRequisitionPalette } from "src/language-service/completion/actions/player_set_requisition_palette";
import { completePlayerSetUnit } from "src/language-service/completion/actions/player_set_unit";
import { completePlayerSetVehicle } from "src/language-service/completion/actions/player_set_vehicle";
import { completePlayerSetVehicleSpawning } from "src/language-service/completion/actions/player_set_vehicle_spawning";
import { completePrintVariable } from "src/language-service/completion/actions/print_variable";
import { completeRandom } from "src/language-service/completion/actions/random";
import { completeRespawnZoneEnable } from "src/language-service/completion/actions/respawn_zone_enable";
import { completeSavedFilmInsertMarker } from "src/language-service/completion/actions/saved_film_insert_marker";
import { completeSet } from "src/language-service/completion/actions/set";
import { completeSetBoundary } from "src/language-service/completion/actions/set_boundary";
import { completeSetFireteamRespawnFilter } from "src/language-service/completion/actions/set_fireteam_respawn_filter";
import { completeSetLoadoutPalette } from "src/language-service/completion/actions/set_loadout_palette";
import { completeSetPickupFilter } from "src/language-service/completion/actions/set_pickup_filter";
import { completeSetPlayerRespawnVehicle } from "src/language-service/completion/actions/set_player_respawn_vehicle";
import { completeSetProgressBar } from "src/language-service/completion/actions/set_progress_bar";
import { completeSetRespawnFilter } from "src/language-service/completion/actions/set_respawn_filter";
import { completeSetScenarioInterpolatorState } from "src/language-service/completion/actions/set_scenario_interpolator_state";
import { completeSetScore } from "src/language-service/completion/actions/set_score";
import { completeSetTeamRespawnVehicle } from "src/language-service/completion/actions/set_team_respawn_vehicle";
import { completeSubmitIncident } from "src/language-service/completion/actions/submit_incident";
import { completeSubmitIncidentWithCustomValue } from "src/language-service/completion/actions/submit_incident_with_custom_value";
import { completeTeamGetPlace } from "src/language-service/completion/actions/team_get_place";
import { completeTeamSetCoopSpawning } from "src/language-service/completion/actions/team_set_coop_spawning";
import { completeTeamSetPrimaryRespawnObject } from "src/language-service/completion/actions/team_set_primary_respawn_object";
import { completeTeamSetVehicleSpawning } from "src/language-service/completion/actions/team_set_vehicle_spawning";
import { completeTimerReset } from "src/language-service/completion/actions/timer_reset";
import { completeTimerSetRate } from "src/language-service/completion/actions/timer_set_rate";
import { completeWeaponSetPickupPriority } from "src/language-service/completion/actions/weapon_set_pickup_priority";
import type {
  ActionCompleter,
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const ACTION_COMPLETERS: Record<string, ActionCompleter> = {
  adjust_grenades: completeAdjustGrenades,
  apply_player_traits: completeApplyPlayerTraits,
  biped_drop_weapon: completeBipedDropWeapon,
  biped_give_weapon: completeBipedGiveWeapon,
  boundary_set_player_color: completeBoundarySetPlayerColor,
  boundary_set_visible: completeBoundarySetVisible,
  break_into_debugger: completeBreakIntoDebugger,
  create_object: completeCreateObject,
  create_tunnel: completeCreateTunnel,
  debug_force_player_view_count: completeDebugForcePlayerViewCount,
  debugging_enable_tracing: completeDebuggingEnableTracing,
  delete_object: completeDeleteObject,
  device_animate_position: completeDeviceAnimatePosition,
  device_get_position: completeDeviceGetPosition,
  device_get_power: completeDeviceGetPower,
  device_set_position: completeDeviceSetPosition,
  device_set_position_immediate: completeDeviceSetPositionImmediate,
  device_set_position_track: completeDeviceSetPositionTrack,
  device_set_power: completeDeviceSetPower,
  end_round: completeEndRound,
  for_each: completeForEach,
  game_grief_record_custom_penalty: completeGameGriefRecordCustomPenalty,
  get_button_time: completeGetButtonTime,
  get_player_holding_object: completeGetPlayerHoldingObject,
  get_random_object: completeGetRandomObject,
  hide_object: completeHideObject,
  hs_function_call: completeHsFunctionCall,
  hud_post_message: completeHudPostMessage,
  hud_widget_set_icon: completeHudWidgetSetIcon,
  hud_widget_set_meter: completeHudWidgetSetMeter,
  hud_widget_set_text: completeHudWidgetSetText,
  hud_widget_set_value: completeHudWidgetSetValue,
  hud_widget_set_visibility: completeHudWidgetSetVisibility,
  navpoint_set_icon: completeNavpointSetIcon,
  navpoint_set_priority: completeNavpointSetPriority,
  navpoint_set_text: completeNavpointSetText,
  navpoint_set_timer: completeNavpointSetTimer,
  navpoint_set_visible: completeNavpointSetVisible,
  navpoint_set_visible_range: completeNavpointSetVisibleRange,
  object_adjust_health: completeObjectAdjustHealth,
  object_adjust_maximum_health: completeObjectAdjustMaximumHealth,
  object_adjust_maximum_shield: completeObjectAdjustMaximumShield,
  object_adjust_shield: completeObjectAdjustShield,
  object_attach: completeObjectAttach,
  object_bounce: completeObjectBounce,
  object_destroy: completeObjectDestroy,
  object_detach: completeObjectDetach,
  object_face_object: completeObjectFaceObject,
  object_get_distance: completeObjectGetDistance,
  object_get_health: completeObjectGetHealth,
  object_get_orientation: completeObjectGetOrientation,
  object_get_shield: completeObjectGetShield,
  object_get_velocity: completeObjectGetVelocity,
  object_set_invincibility: completeObjectSetInvincibility,
  object_set_never_garbage: completeObjectSetNeverGarbage,
  object_set_orientation: completeObjectSetOrientation,
  object_set_scale: completeObjectSetScale,
  play_sound: completePlaySound,
  player_adjust_money: completePlayerAdjustMoney,
  player_death_get_damage_type: completePlayerDeathGetDamageType,
  player_death_get_killing_player: completePlayerDeathGetKillingPlayer,
  player_death_get_special_type: completePlayerDeathGetSpecialType,
  player_enable_purchases: completePlayerEnablePurchases,
  player_get_equipment: completePlayerGetEquipment,
  player_get_fireteam_index: completePlayerGetFireteamIndex,
  player_get_killing_spree_count: completePlayerGetKillingSpreeCount,
  player_get_place: completePlayerGetPlace,
  player_get_target_object: completePlayerGetTargetObject,
  player_get_vehicle: completePlayerGetVehicle,
  player_get_weapon: completePlayerGetWeapon,
  player_pick_up_weapon: completePlayerPickUpWeapon,
  player_set_coop_spawning: completePlayerSetCoopSpawning,
  player_set_fireteam_index: completePlayerSetFireteamIndex,
  player_set_objective: completePlayerSetObjective,
  player_set_objective_allegiance: completePlayerSetObjectiveAllegiance,
  player_set_objective_allegiance_icon:
    completePlayerSetObjectiveAllegianceIcon,
  player_set_primary_respawn_object: completePlayerSetPrimaryRespawnObject,
  player_set_requisition_palette: completePlayerSetRequisitionPalette,
  player_set_unit: completePlayerSetUnit,
  player_set_vehicle: completePlayerSetVehicle,
  player_set_vehicle_spawning: completePlayerSetVehicleSpawning,
  print_variable: completePrintVariable,
  random: completeRandom,
  respawn_zone_enable: completeRespawnZoneEnable,
  saved_film_insert_marker: completeSavedFilmInsertMarker,
  set: completeSet,
  set_boundary: completeSetBoundary,
  set_fireteam_respawn_filter: completeSetFireteamRespawnFilter,
  set_loadout_palette: completeSetLoadoutPalette,
  set_pickup_filter: completeSetPickupFilter,
  set_player_respawn_vehicle: completeSetPlayerRespawnVehicle,
  set_progress_bar: completeSetProgressBar,
  set_respawn_filter: completeSetRespawnFilter,
  set_scenario_interpolator_state: completeSetScenarioInterpolatorState,
  set_score: completeSetScore,
  set_team_respawn_vehicle: completeSetTeamRespawnVehicle,
  submit_incident: completeSubmitIncident,
  submit_incident_with_custom_value: completeSubmitIncidentWithCustomValue,
  team_get_place: completeTeamGetPlace,
  team_set_coop_spawning: completeTeamSetCoopSpawning,
  team_set_primary_respawn_object: completeTeamSetPrimaryRespawnObject,
  team_set_vehicle_spawning: completeTeamSetVehicleSpawning,
  timer_reset: completeTimerReset,
  timer_set_rate: completeTimerSetRate,
  weapon_set_pickup_priority: completeWeaponSetPickupPriority,
};

/** Dispatch operand completion for an action statement. */
export const completeActionOperands = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const completer = ACTION_COMPLETERS[ctx.statement.name.value];
  if (completer === undefined) {
    return [];
  }
  return completer(ctx);
};
