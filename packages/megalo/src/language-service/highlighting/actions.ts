import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { highlightAdjustGrenades } from "src/language-service/highlighting/actions/adjust_grenades";
import { highlightApplyPlayerTraits } from "src/language-service/highlighting/actions/apply_player_traits";
import { highlightBipedDropWeapon } from "src/language-service/highlighting/actions/biped_drop_weapon";
import { highlightBipedGiveWeapon } from "src/language-service/highlighting/actions/biped_give_weapon";
import { highlightBoundarySetPlayerColor } from "src/language-service/highlighting/actions/boundary_set_player_color";
import { highlightBoundarySetVisible } from "src/language-service/highlighting/actions/boundary_set_visible";
import { highlightBreakIntoDebugger } from "src/language-service/highlighting/actions/break_into_debugger";
import { highlightCreateObject } from "src/language-service/highlighting/actions/create_object";
import { highlightCreateTunnel } from "src/language-service/highlighting/actions/create_tunnel";
import { highlightDebugForcePlayerViewCount } from "src/language-service/highlighting/actions/debug_force_player_view_count";
import { highlightDebuggingEnableTracing } from "src/language-service/highlighting/actions/debugging_enable_tracing";
import { highlightDeleteObject } from "src/language-service/highlighting/actions/delete_object";
import { highlightDeviceAnimatePosition } from "src/language-service/highlighting/actions/device_animate_position";
import { highlightDeviceGetPosition } from "src/language-service/highlighting/actions/device_get_position";
import { highlightDeviceGetPower } from "src/language-service/highlighting/actions/device_get_power";
import { highlightDeviceSetPosition } from "src/language-service/highlighting/actions/device_set_position";
import { highlightDeviceSetPositionImmediate } from "src/language-service/highlighting/actions/device_set_position_immediate";
import { highlightDeviceSetPositionTrack } from "src/language-service/highlighting/actions/device_set_position_track";
import { highlightDeviceSetPower } from "src/language-service/highlighting/actions/device_set_power";
import { highlightEndRound } from "src/language-service/highlighting/actions/end_round";
import { highlightForEach } from "src/language-service/highlighting/actions/for_each";
import { highlightGameGriefRecordCustomPenalty } from "src/language-service/highlighting/actions/game_grief_record_custom_penalty";
import { highlightGetButtonTime } from "src/language-service/highlighting/actions/get_button_time";
import { highlightGetPlayerHoldingObject } from "src/language-service/highlighting/actions/get_player_holding_object";
import { highlightGetRandomObject } from "src/language-service/highlighting/actions/get_random_object";
import { highlightHideObject } from "src/language-service/highlighting/actions/hide_object";
import { highlightHsFunctionCall } from "src/language-service/highlighting/actions/hs_function_call";
import { highlightHudPostMessage } from "src/language-service/highlighting/actions/hud_post_message";
import { highlightHudWidgetSetIcon } from "src/language-service/highlighting/actions/hud_widget_set_icon";
import { highlightHudWidgetSetMeter } from "src/language-service/highlighting/actions/hud_widget_set_meter";
import { highlightHudWidgetSetText } from "src/language-service/highlighting/actions/hud_widget_set_text";
import { highlightHudWidgetSetValue } from "src/language-service/highlighting/actions/hud_widget_set_value";
import { highlightHudWidgetSetVisibility } from "src/language-service/highlighting/actions/hud_widget_set_visibility";
import { highlightNavpointSetIcon } from "src/language-service/highlighting/actions/navpoint_set_icon";
import { highlightNavpointSetPriority } from "src/language-service/highlighting/actions/navpoint_set_priority";
import { highlightNavpointSetText } from "src/language-service/highlighting/actions/navpoint_set_text";
import { highlightNavpointSetTimer } from "src/language-service/highlighting/actions/navpoint_set_timer";
import { highlightNavpointSetVisible } from "src/language-service/highlighting/actions/navpoint_set_visible";
import { highlightNavpointSetVisibleRange } from "src/language-service/highlighting/actions/navpoint_set_visible_range";
import { highlightObjectAdjustHealth } from "src/language-service/highlighting/actions/object_adjust_health";
import { highlightObjectAdjustMaximumHealth } from "src/language-service/highlighting/actions/object_adjust_maximum_health";
import { highlightObjectAdjustMaximumShield } from "src/language-service/highlighting/actions/object_adjust_maximum_shield";
import { highlightObjectAdjustShield } from "src/language-service/highlighting/actions/object_adjust_shield";
import { highlightObjectAttach } from "src/language-service/highlighting/actions/object_attach";
import { highlightObjectBounce } from "src/language-service/highlighting/actions/object_bounce";
import { highlightObjectDestroy } from "src/language-service/highlighting/actions/object_destroy";
import { highlightObjectDetach } from "src/language-service/highlighting/actions/object_detach";
import { highlightObjectFaceObject } from "src/language-service/highlighting/actions/object_face_object";
import { highlightObjectGetDistance } from "src/language-service/highlighting/actions/object_get_distance";
import { highlightObjectGetHealth } from "src/language-service/highlighting/actions/object_get_health";
import { highlightObjectGetOrientation } from "src/language-service/highlighting/actions/object_get_orientation";
import { highlightObjectGetShield } from "src/language-service/highlighting/actions/object_get_shield";
import { highlightObjectGetVelocity } from "src/language-service/highlighting/actions/object_get_velocity";
import { highlightObjectSetInvincibility } from "src/language-service/highlighting/actions/object_set_invincibility";
import { highlightObjectSetNeverGarbage } from "src/language-service/highlighting/actions/object_set_never_garbage";
import { highlightObjectSetOrientation } from "src/language-service/highlighting/actions/object_set_orientation";
import { highlightObjectSetScale } from "src/language-service/highlighting/actions/object_set_scale";
import { highlightPlaySound } from "src/language-service/highlighting/actions/play_sound";
import { highlightPlayerAdjustMoney } from "src/language-service/highlighting/actions/player_adjust_money";
import { highlightPlayerDeathGetDamageType } from "src/language-service/highlighting/actions/player_death_get_damage_type";
import { highlightPlayerDeathGetKillingPlayer } from "src/language-service/highlighting/actions/player_death_get_killing_player";
import { highlightPlayerDeathGetSpecialType } from "src/language-service/highlighting/actions/player_death_get_special_type";
import { highlightPlayerEnablePurchases } from "src/language-service/highlighting/actions/player_enable_purchases";
import { highlightPlayerGetEquipment } from "src/language-service/highlighting/actions/player_get_equipment";
import { highlightPlayerGetFireteamIndex } from "src/language-service/highlighting/actions/player_get_fireteam_index";
import { highlightPlayerGetKillingSpreeCount } from "src/language-service/highlighting/actions/player_get_killing_spree_count";
import { highlightPlayerGetPlace } from "src/language-service/highlighting/actions/player_get_place";
import { highlightPlayerGetTargetObject } from "src/language-service/highlighting/actions/player_get_target_object";
import { highlightPlayerGetVehicle } from "src/language-service/highlighting/actions/player_get_vehicle";
import { highlightPlayerGetWeapon } from "src/language-service/highlighting/actions/player_get_weapon";
import { highlightPlayerPickUpWeapon } from "src/language-service/highlighting/actions/player_pick_up_weapon";
import { highlightPlayerSetCoopSpawning } from "src/language-service/highlighting/actions/player_set_coop_spawning";
import { highlightPlayerSetFireteamIndex } from "src/language-service/highlighting/actions/player_set_fireteam_index";
import { highlightPlayerSetObjective } from "src/language-service/highlighting/actions/player_set_objective";
import { highlightPlayerSetObjectiveAllegiance } from "src/language-service/highlighting/actions/player_set_objective_allegiance";
import { highlightPlayerSetObjectiveAllegianceIcon } from "src/language-service/highlighting/actions/player_set_objective_allegiance_icon";
import { highlightPlayerSetPrimaryRespawnObject } from "src/language-service/highlighting/actions/player_set_primary_respawn_object";
import { highlightPlayerSetRequisitionPalette } from "src/language-service/highlighting/actions/player_set_requisition_palette";
import { highlightPlayerSetUnit } from "src/language-service/highlighting/actions/player_set_unit";
import { highlightPlayerSetVehicle } from "src/language-service/highlighting/actions/player_set_vehicle";
import { highlightPlayerSetVehicleSpawning } from "src/language-service/highlighting/actions/player_set_vehicle_spawning";
import { highlightPrintVariable } from "src/language-service/highlighting/actions/print_variable";
import { highlightRandom } from "src/language-service/highlighting/actions/random";
import { highlightRespawnZoneEnable } from "src/language-service/highlighting/actions/respawn_zone_enable";
import { highlightSavedFilmInsertMarker } from "src/language-service/highlighting/actions/saved_film_insert_marker";
import { highlightSet } from "src/language-service/highlighting/actions/set";
import { highlightSetBoundary } from "src/language-service/highlighting/actions/set_boundary";
import { highlightSetFireteamRespawnFilter } from "src/language-service/highlighting/actions/set_fireteam_respawn_filter";
import { highlightSetLoadoutPalette } from "src/language-service/highlighting/actions/set_loadout_palette";
import { highlightSetPickupFilter } from "src/language-service/highlighting/actions/set_pickup_filter";
import { highlightSetPlayerRespawnVehicle } from "src/language-service/highlighting/actions/set_player_respawn_vehicle";
import { highlightSetProgressBar } from "src/language-service/highlighting/actions/set_progress_bar";
import { highlightSetRespawnFilter } from "src/language-service/highlighting/actions/set_respawn_filter";
import { highlightSetScenarioInterpolatorState } from "src/language-service/highlighting/actions/set_scenario_interpolator_state";
import { highlightSetScore } from "src/language-service/highlighting/actions/set_score";
import { highlightSetTeamRespawnVehicle } from "src/language-service/highlighting/actions/set_team_respawn_vehicle";
import { highlightSubmitIncident } from "src/language-service/highlighting/actions/submit_incident";
import { highlightSubmitIncidentWithCustomValue } from "src/language-service/highlighting/actions/submit_incident_with_custom_value";
import { highlightTeamGetPlace } from "src/language-service/highlighting/actions/team_get_place";
import { highlightTeamSetCoopSpawning } from "src/language-service/highlighting/actions/team_set_coop_spawning";
import { highlightTeamSetPrimaryRespawnObject } from "src/language-service/highlighting/actions/team_set_primary_respawn_object";
import { highlightTeamSetVehicleSpawning } from "src/language-service/highlighting/actions/team_set_vehicle_spawning";
import { highlightTimerReset } from "src/language-service/highlighting/actions/timer_reset";
import { highlightTimerSetRate } from "src/language-service/highlighting/actions/timer_set_rate";
import { highlightWeaponSetPickupPriority } from "src/language-service/highlighting/actions/weapon_set_pickup_priority";
import type { SemanticToken } from "src/language-service/highlighting/types";

export type ActionParameterHighlighter = (
  out: SemanticToken[],
  statement: ActionStatementNode
) => void;

const ACTION_PARAMETER_HIGHLIGHTERS: Record<
  string,
  ActionParameterHighlighter
> = {
  adjust_grenades: highlightAdjustGrenades,
  apply_player_traits: highlightApplyPlayerTraits,
  biped_drop_weapon: highlightBipedDropWeapon,
  biped_give_weapon: highlightBipedGiveWeapon,
  boundary_set_player_color: highlightBoundarySetPlayerColor,
  boundary_set_visible: highlightBoundarySetVisible,
  break_into_debugger: highlightBreakIntoDebugger,
  create_object: highlightCreateObject,
  create_tunnel: highlightCreateTunnel,
  debug_force_player_view_count: highlightDebugForcePlayerViewCount,
  debugging_enable_tracing: highlightDebuggingEnableTracing,
  delete_object: highlightDeleteObject,
  device_animate_position: highlightDeviceAnimatePosition,
  device_get_position: highlightDeviceGetPosition,
  device_get_power: highlightDeviceGetPower,
  device_set_position: highlightDeviceSetPosition,
  device_set_position_immediate: highlightDeviceSetPositionImmediate,
  device_set_position_track: highlightDeviceSetPositionTrack,
  device_set_power: highlightDeviceSetPower,
  end_round: highlightEndRound,
  for_each: highlightForEach,
  game_grief_record_custom_penalty: highlightGameGriefRecordCustomPenalty,
  get_button_time: highlightGetButtonTime,
  get_player_holding_object: highlightGetPlayerHoldingObject,
  get_random_object: highlightGetRandomObject,
  hide_object: highlightHideObject,
  hs_function_call: highlightHsFunctionCall,
  hud_post_message: highlightHudPostMessage,
  hud_widget_set_icon: highlightHudWidgetSetIcon,
  hud_widget_set_meter: highlightHudWidgetSetMeter,
  hud_widget_set_text: highlightHudWidgetSetText,
  hud_widget_set_value: highlightHudWidgetSetValue,
  hud_widget_set_visibility: highlightHudWidgetSetVisibility,
  navpoint_set_icon: highlightNavpointSetIcon,
  navpoint_set_priority: highlightNavpointSetPriority,
  navpoint_set_text: highlightNavpointSetText,
  navpoint_set_timer: highlightNavpointSetTimer,
  navpoint_set_visible: highlightNavpointSetVisible,
  navpoint_set_visible_range: highlightNavpointSetVisibleRange,
  object_adjust_health: highlightObjectAdjustHealth,
  object_adjust_maximum_health: highlightObjectAdjustMaximumHealth,
  object_adjust_maximum_shield: highlightObjectAdjustMaximumShield,
  object_adjust_shield: highlightObjectAdjustShield,
  object_attach: highlightObjectAttach,
  object_bounce: highlightObjectBounce,
  object_destroy: highlightObjectDestroy,
  object_detach: highlightObjectDetach,
  object_face_object: highlightObjectFaceObject,
  object_get_distance: highlightObjectGetDistance,
  object_get_health: highlightObjectGetHealth,
  object_get_orientation: highlightObjectGetOrientation,
  object_get_shield: highlightObjectGetShield,
  object_get_velocity: highlightObjectGetVelocity,
  object_set_invincibility: highlightObjectSetInvincibility,
  object_set_never_garbage: highlightObjectSetNeverGarbage,
  object_set_orientation: highlightObjectSetOrientation,
  object_set_scale: highlightObjectSetScale,
  play_sound: highlightPlaySound,
  player_adjust_money: highlightPlayerAdjustMoney,
  player_death_get_damage_type: highlightPlayerDeathGetDamageType,
  player_death_get_killing_player: highlightPlayerDeathGetKillingPlayer,
  player_death_get_special_type: highlightPlayerDeathGetSpecialType,
  player_enable_purchases: highlightPlayerEnablePurchases,
  player_get_equipment: highlightPlayerGetEquipment,
  player_get_fireteam_index: highlightPlayerGetFireteamIndex,
  player_get_killing_spree_count: highlightPlayerGetKillingSpreeCount,
  player_get_place: highlightPlayerGetPlace,
  player_get_target_object: highlightPlayerGetTargetObject,
  player_get_vehicle: highlightPlayerGetVehicle,
  player_get_weapon: highlightPlayerGetWeapon,
  player_pick_up_weapon: highlightPlayerPickUpWeapon,
  player_set_coop_spawning: highlightPlayerSetCoopSpawning,
  player_set_fireteam_index: highlightPlayerSetFireteamIndex,
  player_set_objective: highlightPlayerSetObjective,
  player_set_objective_allegiance: highlightPlayerSetObjectiveAllegiance,
  player_set_objective_allegiance_icon:
    highlightPlayerSetObjectiveAllegianceIcon,
  player_set_primary_respawn_object: highlightPlayerSetPrimaryRespawnObject,
  player_set_requisition_palette: highlightPlayerSetRequisitionPalette,
  player_set_unit: highlightPlayerSetUnit,
  player_set_vehicle: highlightPlayerSetVehicle,
  player_set_vehicle_spawning: highlightPlayerSetVehicleSpawning,
  print_variable: highlightPrintVariable,
  random: highlightRandom,
  respawn_zone_enable: highlightRespawnZoneEnable,
  saved_film_insert_marker: highlightSavedFilmInsertMarker,
  set: highlightSet,
  set_boundary: highlightSetBoundary,
  set_fireteam_respawn_filter: highlightSetFireteamRespawnFilter,
  set_loadout_palette: highlightSetLoadoutPalette,
  set_pickup_filter: highlightSetPickupFilter,
  set_player_respawn_vehicle: highlightSetPlayerRespawnVehicle,
  set_progress_bar: highlightSetProgressBar,
  set_respawn_filter: highlightSetRespawnFilter,
  set_scenario_interpolator_state: highlightSetScenarioInterpolatorState,
  set_score: highlightSetScore,
  set_team_respawn_vehicle: highlightSetTeamRespawnVehicle,
  submit_incident: highlightSubmitIncident,
  submit_incident_with_custom_value: highlightSubmitIncidentWithCustomValue,
  team_get_place: highlightTeamGetPlace,
  team_set_coop_spawning: highlightTeamSetCoopSpawning,
  team_set_primary_respawn_object: highlightTeamSetPrimaryRespawnObject,
  team_set_vehicle_spawning: highlightTeamSetVehicleSpawning,
  timer_reset: highlightTimerReset,
  timer_set_rate: highlightTimerSetRate,
  weapon_set_pickup_priority: highlightWeaponSetPickupPriority,
};

/** Dispatch parameter highlighting for an action statement. */
export const highlightActionParameters = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const highlighter = ACTION_PARAMETER_HIGHLIGHTERS[statement.name.value];
  if (highlighter === undefined) {
    return;
  }
  highlighter(out, statement);
};
