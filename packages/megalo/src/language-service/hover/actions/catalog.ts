import { adjustGrenadesHover } from "src/language-service/hover/actions/adjust_grenades";
import { applyPlayerTraitsHover } from "src/language-service/hover/actions/apply_player_traits";
import { beginHover } from "src/language-service/hover/actions/begin";
import { bipedDropWeaponHover } from "src/language-service/hover/actions/biped_drop_weapon";
import { bipedGiveWeaponHover } from "src/language-service/hover/actions/biped_give_weapon";
import { boundarySetPlayerColorHover } from "src/language-service/hover/actions/boundary_set_player_color";
import { boundarySetVisibleHover } from "src/language-service/hover/actions/boundary_set_visible";
import { breakIntoDebuggerHover } from "src/language-service/hover/actions/break_into_debugger";
import { createObjectHover } from "src/language-service/hover/actions/create_object";
import { createTunnelHover } from "src/language-service/hover/actions/create_tunnel";
import { debugForcePlayerViewCountHover } from "src/language-service/hover/actions/debug_force_player_view_count";
import { debuggingEnableTracingHover } from "src/language-service/hover/actions/debugging_enable_tracing";
import { deleteObjectHover } from "src/language-service/hover/actions/delete_object";
import { deviceAnimatePositionHover } from "src/language-service/hover/actions/device_animate_position";
import { deviceGetPositionHover } from "src/language-service/hover/actions/device_get_position";
import { deviceGetPowerHover } from "src/language-service/hover/actions/device_get_power";
import { deviceSetPositionHover } from "src/language-service/hover/actions/device_set_position";
import { deviceSetPositionImmediateHover } from "src/language-service/hover/actions/device_set_position_immediate";
import { deviceSetPositionTrackHover } from "src/language-service/hover/actions/device_set_position_track";
import { deviceSetPowerHover } from "src/language-service/hover/actions/device_set_power";
import { endRoundHover } from "src/language-service/hover/actions/end_round";
import { forEachHover } from "src/language-service/hover/actions/for_each";
import { gameGriefRecordCustomPenaltyHover } from "src/language-service/hover/actions/game_grief_record_custom_penalty";
import { getButtonTimeHover } from "src/language-service/hover/actions/get_button_time";
import { getPlayerHoldingObjectHover } from "src/language-service/hover/actions/get_player_holding_object";
import { getRandomObjectHover } from "src/language-service/hover/actions/get_random_object";
import { giveWeaponHover } from "src/language-service/hover/actions/give_weapon";
import { hideObjectHover } from "src/language-service/hover/actions/hide_object";
import { hsFunctionCallHover } from "src/language-service/hover/actions/hs_function_call";
import { hudPostMessageHover } from "src/language-service/hover/actions/hud_post_message";
import { hudWidgetSetIconHover } from "src/language-service/hover/actions/hud_widget_set_icon";
import { hudWidgetSetMeterHover } from "src/language-service/hover/actions/hud_widget_set_meter";
import { hudWidgetSetTextHover } from "src/language-service/hover/actions/hud_widget_set_text";
import { hudWidgetSetValueHover } from "src/language-service/hover/actions/hud_widget_set_value";
import { hudWidgetSetVisibilityHover } from "src/language-service/hover/actions/hud_widget_set_visibility";
import { navpointSetIconHover } from "src/language-service/hover/actions/navpoint_set_icon";
import { navpointSetPriorityHover } from "src/language-service/hover/actions/navpoint_set_priority";
import { navpointSetTextHover } from "src/language-service/hover/actions/navpoint_set_text";
import { navpointSetTimerHover } from "src/language-service/hover/actions/navpoint_set_timer";
import { navpointSetVisibleHover } from "src/language-service/hover/actions/navpoint_set_visible";
import { navpointSetVisibleRangeHover } from "src/language-service/hover/actions/navpoint_set_visible_range";
import { objectAdjustHealthHover } from "src/language-service/hover/actions/object_adjust_health";
import { objectAdjustMaximumHealthHover } from "src/language-service/hover/actions/object_adjust_maximum_health";
import { objectAdjustMaximumShieldHover } from "src/language-service/hover/actions/object_adjust_maximum_shield";
import { objectAdjustShieldHover } from "src/language-service/hover/actions/object_adjust_shield";
import { objectAttachHover } from "src/language-service/hover/actions/object_attach";
import { objectBounceHover } from "src/language-service/hover/actions/object_bounce";
import { objectDestroyHover } from "src/language-service/hover/actions/object_destroy";
import { objectDetachHover } from "src/language-service/hover/actions/object_detach";
import { objectFaceObjectHover } from "src/language-service/hover/actions/object_face_object";
import { objectGetDistanceHover } from "src/language-service/hover/actions/object_get_distance";
import { objectGetHealthHover } from "src/language-service/hover/actions/object_get_health";
import { objectGetOrientationHover } from "src/language-service/hover/actions/object_get_orientation";
import { objectGetShieldHover } from "src/language-service/hover/actions/object_get_shield";
import { objectGetVelocityHover } from "src/language-service/hover/actions/object_get_velocity";
import { objectSetInvincibilityHover } from "src/language-service/hover/actions/object_set_invincibility";
import { objectSetMinimapIconHover } from "src/language-service/hover/actions/object_set_minimap_icon";
import { objectSetMinimapPriorityHover } from "src/language-service/hover/actions/object_set_minimap_priority";
import { objectSetMinimapVisibilityHover } from "src/language-service/hover/actions/object_set_minimap_visibility";
import { objectSetNeverGarbageHover } from "src/language-service/hover/actions/object_set_never_garbage";
import { objectSetOrientationHover } from "src/language-service/hover/actions/object_set_orientation";
import { objectSetScaleHover } from "src/language-service/hover/actions/object_set_scale";
import { playSoundHover } from "src/language-service/hover/actions/play_sound";
import { playerAdjustMoneyHover } from "src/language-service/hover/actions/player_adjust_money";
import { playerDeathGetDamageTypeHover } from "src/language-service/hover/actions/player_death_get_damage_type";
import { playerDeathGetKillingPlayerHover } from "src/language-service/hover/actions/player_death_get_killing_player";
import { playerDeathGetSpecialTypeHover } from "src/language-service/hover/actions/player_death_get_special_type";
import { playerEnablePurchasesHover } from "src/language-service/hover/actions/player_enable_purchases";
import { playerGetEquipmentHover } from "src/language-service/hover/actions/player_get_equipment";
import { playerGetFireteamIndexHover } from "src/language-service/hover/actions/player_get_fireteam_index";
import { playerGetKillingSpreeCountHover } from "src/language-service/hover/actions/player_get_killing_spree_count";
import { playerGetPlaceHover } from "src/language-service/hover/actions/player_get_place";
import { playerGetTargetObjectHover } from "src/language-service/hover/actions/player_get_target_object";
import { playerGetVehicleHover } from "src/language-service/hover/actions/player_get_vehicle";
import { playerGetWeaponHover } from "src/language-service/hover/actions/player_get_weapon";
import { playerPickUpWeaponHover } from "src/language-service/hover/actions/player_pick_up_weapon";
import { playerSetCoopSpawningHover } from "src/language-service/hover/actions/player_set_coop_spawning";
import { playerSetFireteamIndexHover } from "src/language-service/hover/actions/player_set_fireteam_index";
import { playerSetFireteamTierHover } from "src/language-service/hover/actions/player_set_fireteam_tier";
import { playerSetObjectiveHover } from "src/language-service/hover/actions/player_set_objective";
import { playerSetObjectiveAllegianceHover } from "src/language-service/hover/actions/player_set_objective_allegiance";
import { playerSetObjectiveAllegianceIconHover } from "src/language-service/hover/actions/player_set_objective_allegiance_icon";
import { playerSetPrimaryRespawnObjectHover } from "src/language-service/hover/actions/player_set_primary_respawn_object";
import { playerSetRequisitionPaletteHover } from "src/language-service/hover/actions/player_set_requisition_palette";
import { playerSetUnitHover } from "src/language-service/hover/actions/player_set_unit";
import { playerSetVehicleHover } from "src/language-service/hover/actions/player_set_vehicle";
import { playerSetVehicleSpawningHover } from "src/language-service/hover/actions/player_set_vehicle_spawning";
import { printVariableHover } from "src/language-service/hover/actions/print_variable";
import { randomHover } from "src/language-service/hover/actions/random";
import { respawnZoneEnableHover } from "src/language-service/hover/actions/respawn_zone_enable";
import { savedFilmInsertMarkerHover } from "src/language-service/hover/actions/saved_film_insert_marker";
import { setHover } from "src/language-service/hover/actions/set";
import { setBoundaryHover } from "src/language-service/hover/actions/set_boundary";
import { setFireteamRespawnFilterHover } from "src/language-service/hover/actions/set_fireteam_respawn_filter";
import { setLoadoutHover } from "src/language-service/hover/actions/set_loadout";
import { setLoadoutPaletteHover } from "src/language-service/hover/actions/set_loadout_palette";
import { setPickupFilterHover } from "src/language-service/hover/actions/set_pickup_filter";
import { setPlayerRespawnVehicleHover } from "src/language-service/hover/actions/set_player_respawn_vehicle";
import { setProgressBarHover } from "src/language-service/hover/actions/set_progress_bar";
import { setRespawnFilterHover } from "src/language-service/hover/actions/set_respawn_filter";
import { setScenarioInterpolatorStateHover } from "src/language-service/hover/actions/set_scenario_interpolator_state";
import { setScoreHover } from "src/language-service/hover/actions/set_score";
import { setTeamRespawnVehicleHover } from "src/language-service/hover/actions/set_team_respawn_vehicle";
import { submitIncidentHover } from "src/language-service/hover/actions/submit_incident";
import { submitIncidentWithCustomValueHover } from "src/language-service/hover/actions/submit_incident_with_custom_value";
import { teamGetPlaceHover } from "src/language-service/hover/actions/team_get_place";
import { teamSetCoopSpawningHover } from "src/language-service/hover/actions/team_set_coop_spawning";
import { teamSetPrimaryRespawnObjectHover } from "src/language-service/hover/actions/team_set_primary_respawn_object";
import { teamSetVehicleSpawningHover } from "src/language-service/hover/actions/team_set_vehicle_spawning";
import { timerResetHover } from "src/language-service/hover/actions/timer_reset";
import { timerSetRateHover } from "src/language-service/hover/actions/timer_set_rate";
import { weaponSetPickupPriorityHover } from "src/language-service/hover/actions/weapon_set_pickup_priority";
import type { HoverContribution } from "src/language-service/hover/types";

/** Hover for every Megalo action — one module per action under `./`. */
export const actionHovers: readonly HoverContribution[] = [
  adjustGrenadesHover,
  applyPlayerTraitsHover,
  beginHover,
  bipedDropWeaponHover,
  bipedGiveWeaponHover,
  boundarySetPlayerColorHover,
  boundarySetVisibleHover,
  breakIntoDebuggerHover,
  createObjectHover,
  createTunnelHover,
  debugForcePlayerViewCountHover,
  debuggingEnableTracingHover,
  deleteObjectHover,
  deviceAnimatePositionHover,
  deviceGetPositionHover,
  deviceGetPowerHover,
  deviceSetPositionHover,
  deviceSetPositionImmediateHover,
  deviceSetPositionTrackHover,
  deviceSetPowerHover,
  endRoundHover,
  forEachHover,
  gameGriefRecordCustomPenaltyHover,
  getButtonTimeHover,
  getPlayerHoldingObjectHover,
  getRandomObjectHover,
  giveWeaponHover,
  hideObjectHover,
  hsFunctionCallHover,
  hudPostMessageHover,
  hudWidgetSetIconHover,
  hudWidgetSetMeterHover,
  hudWidgetSetTextHover,
  hudWidgetSetValueHover,
  hudWidgetSetVisibilityHover,
  navpointSetIconHover,
  navpointSetPriorityHover,
  navpointSetTextHover,
  navpointSetTimerHover,
  navpointSetVisibleHover,
  navpointSetVisibleRangeHover,
  objectAdjustHealthHover,
  objectAdjustMaximumHealthHover,
  objectAdjustMaximumShieldHover,
  objectAdjustShieldHover,
  objectAttachHover,
  objectBounceHover,
  objectDestroyHover,
  objectDetachHover,
  objectFaceObjectHover,
  objectGetDistanceHover,
  objectGetHealthHover,
  objectGetOrientationHover,
  objectGetShieldHover,
  objectGetVelocityHover,
  objectSetInvincibilityHover,
  objectSetMinimapIconHover,
  objectSetMinimapPriorityHover,
  objectSetMinimapVisibilityHover,
  objectSetNeverGarbageHover,
  objectSetOrientationHover,
  objectSetScaleHover,
  playSoundHover,
  playerAdjustMoneyHover,
  playerDeathGetDamageTypeHover,
  playerDeathGetKillingPlayerHover,
  playerDeathGetSpecialTypeHover,
  playerEnablePurchasesHover,
  playerGetEquipmentHover,
  playerGetFireteamIndexHover,
  playerGetKillingSpreeCountHover,
  playerGetPlaceHover,
  playerGetTargetObjectHover,
  playerGetVehicleHover,
  playerGetWeaponHover,
  playerPickUpWeaponHover,
  playerSetCoopSpawningHover,
  playerSetFireteamIndexHover,
  playerSetFireteamTierHover,
  playerSetObjectiveHover,
  playerSetObjectiveAllegianceHover,
  playerSetObjectiveAllegianceIconHover,
  playerSetPrimaryRespawnObjectHover,
  playerSetRequisitionPaletteHover,
  playerSetUnitHover,
  playerSetVehicleHover,
  playerSetVehicleSpawningHover,
  printVariableHover,
  randomHover,
  respawnZoneEnableHover,
  savedFilmInsertMarkerHover,
  setHover,
  setBoundaryHover,
  setFireteamRespawnFilterHover,
  setLoadoutHover,
  setLoadoutPaletteHover,
  setPickupFilterHover,
  setPlayerRespawnVehicleHover,
  setProgressBarHover,
  setRespawnFilterHover,
  setScenarioInterpolatorStateHover,
  setScoreHover,
  setTeamRespawnVehicleHover,
  submitIncidentHover,
  submitIncidentWithCustomValueHover,
  teamGetPlaceHover,
  teamSetCoopSpawningHover,
  teamSetPrimaryRespawnObjectHover,
  teamSetVehicleSpawningHover,
  timerResetHover,
  timerSetRateHover,
  weaponSetPickupPriorityHover,
];
