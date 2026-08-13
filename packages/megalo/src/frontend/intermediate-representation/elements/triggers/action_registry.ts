import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { Action } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { lowerAdjustGrenades } from "src/frontend/intermediate-representation/elements/triggers/actions/adjust_grenades";
import { lowerApplyPlayerTraits } from "src/frontend/intermediate-representation/elements/triggers/actions/apply_player_traits";
import { lowerBipedDropWeapon } from "src/frontend/intermediate-representation/elements/triggers/actions/biped_drop_weapon";
import { lowerBipedGiveWeapon } from "src/frontend/intermediate-representation/elements/triggers/actions/biped_give_weapon";
import { lowerBoundarySetPlayerColor } from "src/frontend/intermediate-representation/elements/triggers/actions/boundary_set_player_color";
import { lowerBoundarySetVisible } from "src/frontend/intermediate-representation/elements/triggers/actions/boundary_set_visible";
import { lowerBreakIntoDebugger } from "src/frontend/intermediate-representation/elements/triggers/actions/break_into_debugger";
import { lowerCreateObject } from "src/frontend/intermediate-representation/elements/triggers/actions/create_object";
import { lowerCreateTunnel } from "src/frontend/intermediate-representation/elements/triggers/actions/create_tunnel";
import { lowerDebugForcePlayerViewCount } from "src/frontend/intermediate-representation/elements/triggers/actions/debug_force_player_view_count";
import { lowerDebuggingEnableTracing } from "src/frontend/intermediate-representation/elements/triggers/actions/debugging_enable_tracing";
import { lowerDeleteObject } from "src/frontend/intermediate-representation/elements/triggers/actions/delete_object";
import { lowerDeviceAnimatePosition } from "src/frontend/intermediate-representation/elements/triggers/actions/device_animate_position";
import { lowerDeviceGetPosition } from "src/frontend/intermediate-representation/elements/triggers/actions/device_get_position";
import { lowerDeviceGetPower } from "src/frontend/intermediate-representation/elements/triggers/actions/device_get_power";
import { lowerDeviceSetPosition } from "src/frontend/intermediate-representation/elements/triggers/actions/device_set_position";
import { lowerDeviceSetPositionImmediate } from "src/frontend/intermediate-representation/elements/triggers/actions/device_set_position_immediate";
import { lowerDeviceSetPositionTrack } from "src/frontend/intermediate-representation/elements/triggers/actions/device_set_position_track";
import { lowerDeviceSetPower } from "src/frontend/intermediate-representation/elements/triggers/actions/device_set_power";
import { lowerEndRound } from "src/frontend/intermediate-representation/elements/triggers/actions/end_round";
import { lowerGameGriefRecordCustomPenalty } from "src/frontend/intermediate-representation/elements/triggers/actions/game_grief_record_custom_penalty";
import { lowerGetButtonTime } from "src/frontend/intermediate-representation/elements/triggers/actions/get_button_time";
import { lowerGetPlayerHoldingObject } from "src/frontend/intermediate-representation/elements/triggers/actions/get_player_holding_object";
import { lowerGetRandomObject } from "src/frontend/intermediate-representation/elements/triggers/actions/get_random_object";
import { lowerHideObject } from "src/frontend/intermediate-representation/elements/triggers/actions/hide_object";
import { lowerHsFunctionCall } from "src/frontend/intermediate-representation/elements/triggers/actions/hs_function_call";
import { lowerHudPostMessage } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_post_message";
import { lowerHudWidgetSetIcon } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_widget_set_icon";
import { lowerHudWidgetSetMeter } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_widget_set_meter";
import { lowerHudWidgetSetText } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_widget_set_text";
import { lowerHudWidgetSetValue } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_widget_set_value";
import { lowerHudWidgetSetVisibility } from "src/frontend/intermediate-representation/elements/triggers/actions/hud_widget_set_visibility";
import { lowerNavpointSetIcon } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_icon";
import { lowerNavpointSetPriority } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_priority";
import { lowerNavpointSetText } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_text";
import { lowerNavpointSetTimer } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_timer";
import { lowerNavpointSetVisible } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_visible";
import { lowerNavpointSetVisibleRange } from "src/frontend/intermediate-representation/elements/triggers/actions/navpoint_set_visible_range";
import { lowerObjectAdjustHealth } from "src/frontend/intermediate-representation/elements/triggers/actions/object_adjust_health";
import { lowerObjectAdjustMaximumHealth } from "src/frontend/intermediate-representation/elements/triggers/actions/object_adjust_maximum_health";
import { lowerObjectAdjustMaximumShield } from "src/frontend/intermediate-representation/elements/triggers/actions/object_adjust_maximum_shield";
import { lowerObjectAdjustShield } from "src/frontend/intermediate-representation/elements/triggers/actions/object_adjust_shield";
import { lowerObjectAttach } from "src/frontend/intermediate-representation/elements/triggers/actions/object_attach";
import { lowerObjectBounce } from "src/frontend/intermediate-representation/elements/triggers/actions/object_bounce";
import { lowerObjectDestroy } from "src/frontend/intermediate-representation/elements/triggers/actions/object_destroy";
import { lowerObjectDetach } from "src/frontend/intermediate-representation/elements/triggers/actions/object_detach";
import { lowerObjectFaceObject } from "src/frontend/intermediate-representation/elements/triggers/actions/object_face_object";
import { lowerObjectGetDistance } from "src/frontend/intermediate-representation/elements/triggers/actions/object_get_distance";
import { lowerObjectGetHealth } from "src/frontend/intermediate-representation/elements/triggers/actions/object_get_health";
import { lowerObjectGetOrientation } from "src/frontend/intermediate-representation/elements/triggers/actions/object_get_orientation";
import { lowerObjectGetShield } from "src/frontend/intermediate-representation/elements/triggers/actions/object_get_shield";
import { lowerObjectGetVelocity } from "src/frontend/intermediate-representation/elements/triggers/actions/object_get_velocity";
import { lowerObjectSetInvincibility } from "src/frontend/intermediate-representation/elements/triggers/actions/object_set_invincibility";
import { lowerObjectSetNeverGarbage } from "src/frontend/intermediate-representation/elements/triggers/actions/object_set_never_garbage";
import { lowerObjectSetOrientation } from "src/frontend/intermediate-representation/elements/triggers/actions/object_set_orientation";
import { lowerObjectSetScale } from "src/frontend/intermediate-representation/elements/triggers/actions/object_set_scale";
import { lowerPlaySound } from "src/frontend/intermediate-representation/elements/triggers/actions/play_sound";
import { lowerPlayerAdjustMoney } from "src/frontend/intermediate-representation/elements/triggers/actions/player_adjust_money";
import { lowerPlayerDeathGetDamageType } from "src/frontend/intermediate-representation/elements/triggers/actions/player_death_get_damage_type";
import { lowerPlayerDeathGetKillingPlayer } from "src/frontend/intermediate-representation/elements/triggers/actions/player_death_get_killing_player";
import { lowerPlayerDeathGetSpecialType } from "src/frontend/intermediate-representation/elements/triggers/actions/player_death_get_special_type";
import { lowerPlayerEnablePurchases } from "src/frontend/intermediate-representation/elements/triggers/actions/player_enable_purchases";
import { lowerPlayerGetEquipment } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_equipment";
import { lowerPlayerGetFireteamIndex } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_fireteam_index";
import { lowerPlayerGetKillingSpreeCount } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_killing_spree_count";
import { lowerPlayerGetPlace } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_place";
import { lowerPlayerGetTargetObject } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_target_object";
import { lowerPlayerGetVehicle } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_vehicle";
import { lowerPlayerGetWeapon } from "src/frontend/intermediate-representation/elements/triggers/actions/player_get_weapon";
import { lowerPlayerPickUpWeapon } from "src/frontend/intermediate-representation/elements/triggers/actions/player_pick_up_weapon";
import { lowerPlayerSetCoopSpawning } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_coop_spawning";
import { lowerPlayerSetFireteamIndex } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_fireteam_index";
import { lowerPlayerSetObjective } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_objective";
import { lowerPlayerSetObjectiveAllegiance } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_objective_allegiance";
import { lowerPlayerSetObjectiveAllegianceIcon } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_objective_allegiance_icon";
import { lowerPlayerSetPrimaryRespawnObject } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_primary_respawn_object";
import { lowerPlayerSetRequisitionPalette } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_requisition_palette";
import { lowerPlayerSetUnit } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_unit";
import { lowerPlayerSetVehicle } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_vehicle";
import { lowerPlayerSetVehicleSpawning } from "src/frontend/intermediate-representation/elements/triggers/actions/player_set_vehicle_spawning";
import { lowerPrintVariable } from "src/frontend/intermediate-representation/elements/triggers/actions/print_variable";
import { lowerRandom } from "src/frontend/intermediate-representation/elements/triggers/actions/random";
import { lowerRespawnZoneEnable } from "src/frontend/intermediate-representation/elements/triggers/actions/respawn_zone_enable";
import { lowerSavedFilmInsertMarker } from "src/frontend/intermediate-representation/elements/triggers/actions/saved_film_insert_marker";
import { lowerSet } from "src/frontend/intermediate-representation/elements/triggers/actions/set";
import { lowerSetBoundary } from "src/frontend/intermediate-representation/elements/triggers/actions/set_boundary";
import { lowerSetFireteamRespawnFilter } from "src/frontend/intermediate-representation/elements/triggers/actions/set_fireteam_respawn_filter";
import { lowerSetLoadoutPalette } from "src/frontend/intermediate-representation/elements/triggers/actions/set_loadout_palette";
import { lowerSetPickupFilter } from "src/frontend/intermediate-representation/elements/triggers/actions/set_pickup_filter";
import { lowerSetPlayerRespawnVehicle } from "src/frontend/intermediate-representation/elements/triggers/actions/set_player_respawn_vehicle";
import { lowerSetProgressBar } from "src/frontend/intermediate-representation/elements/triggers/actions/set_progress_bar";
import { lowerSetRespawnFilter } from "src/frontend/intermediate-representation/elements/triggers/actions/set_respawn_filter";
import { lowerSetScenarioInterpolatorState } from "src/frontend/intermediate-representation/elements/triggers/actions/set_scenario_interpolator_state";
import { lowerSetScore } from "src/frontend/intermediate-representation/elements/triggers/actions/set_score";
import { lowerSetTeamRespawnVehicle } from "src/frontend/intermediate-representation/elements/triggers/actions/set_team_respawn_vehicle";
import { lowerSubmitIncident } from "src/frontend/intermediate-representation/elements/triggers/actions/submit_incident";
import { lowerSubmitIncidentWithCustomValue } from "src/frontend/intermediate-representation/elements/triggers/actions/submit_incident_with_custom_value";
import { lowerTeamGetPlace } from "src/frontend/intermediate-representation/elements/triggers/actions/team_get_place";
import { lowerTeamSetCoopSpawning } from "src/frontend/intermediate-representation/elements/triggers/actions/team_set_coop_spawning";
import { lowerTeamSetPrimaryRespawnObject } from "src/frontend/intermediate-representation/elements/triggers/actions/team_set_primary_respawn_object";
import { lowerTeamSetVehicleSpawning } from "src/frontend/intermediate-representation/elements/triggers/actions/team_set_vehicle_spawning";
import { lowerTimerReset } from "src/frontend/intermediate-representation/elements/triggers/actions/timer_reset";
import { lowerTimerSetRate } from "src/frontend/intermediate-representation/elements/triggers/actions/timer_set_rate";
import { lowerWeaponSetPickupPriority } from "src/frontend/intermediate-representation/elements/triggers/actions/weapon_set_pickup_priority";

export type ActionLowerer = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
) => Action;

const ACTION_LOWERERS = new Map<string, ActionLowerer>([
  ["adjust_grenades", lowerAdjustGrenades],
  ["apply_player_traits", lowerApplyPlayerTraits],
  ["biped_drop_weapon", lowerBipedDropWeapon],
  ["biped_give_weapon", lowerBipedGiveWeapon],
  ["boundary_set_player_color", lowerBoundarySetPlayerColor],
  ["boundary_set_visible", lowerBoundarySetVisible],
  ["break_into_debugger", lowerBreakIntoDebugger],
  ["create_object", lowerCreateObject],
  ["create_tunnel", lowerCreateTunnel],
  ["debug_force_player_view_count", lowerDebugForcePlayerViewCount],
  ["debugging_enable_tracing", lowerDebuggingEnableTracing],
  ["delete_object", lowerDeleteObject],
  ["device_animate_position", lowerDeviceAnimatePosition],
  ["device_get_position", lowerDeviceGetPosition],
  ["device_get_power", lowerDeviceGetPower],
  ["device_set_position", lowerDeviceSetPosition],
  ["device_set_position_immediate", lowerDeviceSetPositionImmediate],
  ["device_set_position_track", lowerDeviceSetPositionTrack],
  ["device_set_power", lowerDeviceSetPower],
  ["end_round", lowerEndRound],
  ["game_grief_record_custom_penalty", lowerGameGriefRecordCustomPenalty],
  ["get_button_time", lowerGetButtonTime],
  ["get_player_holding_object", lowerGetPlayerHoldingObject],
  ["get_random_object", lowerGetRandomObject],
  ["hide_object", lowerHideObject],
  ["hs_function_call", lowerHsFunctionCall],
  ["hud_post_message", lowerHudPostMessage],
  ["hud_widget_set_icon", lowerHudWidgetSetIcon],
  ["hud_widget_set_meter", lowerHudWidgetSetMeter],
  ["hud_widget_set_text", lowerHudWidgetSetText],
  ["hud_widget_set_value", lowerHudWidgetSetValue],
  ["hud_widget_set_visibility", lowerHudWidgetSetVisibility],
  ["navpoint_set_icon", lowerNavpointSetIcon],
  ["navpoint_set_priority", lowerNavpointSetPriority],
  ["navpoint_set_text", lowerNavpointSetText],
  ["navpoint_set_timer", lowerNavpointSetTimer],
  ["navpoint_set_visible", lowerNavpointSetVisible],
  ["navpoint_set_visible_range", lowerNavpointSetVisibleRange],
  ["object_adjust_health", lowerObjectAdjustHealth],
  ["object_adjust_maximum_health", lowerObjectAdjustMaximumHealth],
  ["object_adjust_maximum_shield", lowerObjectAdjustMaximumShield],
  ["object_adjust_shield", lowerObjectAdjustShield],
  ["object_attach", lowerObjectAttach],
  ["object_bounce", lowerObjectBounce],
  ["object_destroy", lowerObjectDestroy],
  ["object_detach", lowerObjectDetach],
  ["object_face_object", lowerObjectFaceObject],
  ["object_get_distance", lowerObjectGetDistance],
  ["object_get_health", lowerObjectGetHealth],
  ["object_get_orientation", lowerObjectGetOrientation],
  ["object_get_shield", lowerObjectGetShield],
  ["object_get_velocity", lowerObjectGetVelocity],
  ["object_set_invincibility", lowerObjectSetInvincibility],
  ["object_set_never_garbage", lowerObjectSetNeverGarbage],
  ["object_set_orientation", lowerObjectSetOrientation],
  ["object_set_scale", lowerObjectSetScale],
  ["play_sound", lowerPlaySound],
  ["player_adjust_money", lowerPlayerAdjustMoney],
  ["player_death_get_damage_type", lowerPlayerDeathGetDamageType],
  ["player_death_get_killing_player", lowerPlayerDeathGetKillingPlayer],
  ["player_death_get_special_type", lowerPlayerDeathGetSpecialType],
  ["player_enable_purchases", lowerPlayerEnablePurchases],
  ["player_get_equipment", lowerPlayerGetEquipment],
  ["player_get_fireteam_index", lowerPlayerGetFireteamIndex],
  ["player_get_killing_spree_count", lowerPlayerGetKillingSpreeCount],
  ["player_get_place", lowerPlayerGetPlace],
  ["player_get_target_object", lowerPlayerGetTargetObject],
  ["player_get_vehicle", lowerPlayerGetVehicle],
  ["player_get_weapon", lowerPlayerGetWeapon],
  ["player_pick_up_weapon", lowerPlayerPickUpWeapon],
  ["player_set_coop_spawning", lowerPlayerSetCoopSpawning],
  ["player_set_fireteam_index", lowerPlayerSetFireteamIndex],
  ["player_set_objective", lowerPlayerSetObjective],
  ["player_set_objective_allegiance", lowerPlayerSetObjectiveAllegiance],
  [
    "player_set_objective_allegiance_icon",
    lowerPlayerSetObjectiveAllegianceIcon,
  ],
  ["player_set_primary_respawn_object", lowerPlayerSetPrimaryRespawnObject],
  ["player_set_requisition_palette", lowerPlayerSetRequisitionPalette],
  ["player_set_unit", lowerPlayerSetUnit],
  ["player_set_vehicle", lowerPlayerSetVehicle],
  ["player_set_vehicle_spawning", lowerPlayerSetVehicleSpawning],
  ["print_variable", lowerPrintVariable],
  ["random", lowerRandom],
  ["respawn_zone_enable", lowerRespawnZoneEnable],
  ["saved_film_insert_marker", lowerSavedFilmInsertMarker],
  ["set", lowerSet],
  ["set_boundary", lowerSetBoundary],
  ["set_fireteam_respawn_filter", lowerSetFireteamRespawnFilter],
  ["set_loadout_palette", lowerSetLoadoutPalette],
  ["set_pickup_filter", lowerSetPickupFilter],
  ["set_player_respawn_vehicle", lowerSetPlayerRespawnVehicle],
  ["set_progress_bar", lowerSetProgressBar],
  ["set_respawn_filter", lowerSetRespawnFilter],
  ["set_scenario_interpolator_state", lowerSetScenarioInterpolatorState],
  ["set_score", lowerSetScore],
  ["set_team_respawn_vehicle", lowerSetTeamRespawnVehicle],
  ["submit_incident", lowerSubmitIncident],
  ["submit_incident_with_custom_value", lowerSubmitIncidentWithCustomValue],
  ["team_get_place", lowerTeamGetPlace],
  ["team_set_coop_spawning", lowerTeamSetCoopSpawning],
  ["team_set_primary_respawn_object", lowerTeamSetPrimaryRespawnObject],
  ["team_set_vehicle_spawning", lowerTeamSetVehicleSpawning],
  ["timer_reset", lowerTimerReset],
  ["timer_set_rate", lowerTimerSetRate],
  ["weapon_set_pickup_priority", lowerWeaponSetPickupPriority],
]);

export const registerActionLowerer = (
  name: string,
  lowerer: ActionLowerer,
): void => {
  ACTION_LOWERERS.set(name, lowerer);
};

export const lowerActionStatement = (
  statement: ActionStatementNode,
  ctx: ElementLowerContext,
): Action => {
  const lowerer = ACTION_LOWERERS.get(statement.name.value);
  if (lowerer === undefined) {
    throw new LowerError(
      diagnosticMessages.unknownAction(statement.name.value),
      statement.name.location,
    );
  }
  return lowerer(statement.parameters, ctx, statement.location);
};
