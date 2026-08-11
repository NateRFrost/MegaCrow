import type { ActionStatementNode } from "../../../abstract-syntax-tree/elements/trigger";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { LowerError } from "../../error";
import type { Action } from "../../game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerAdjustGrenades } from "./actions/adjust_grenades";
import { lowerApplyPlayerTraits } from "./actions/apply_player_traits";
import { lowerBipedDropWeapon } from "./actions/biped_drop_weapon";
import { lowerBipedGiveWeapon } from "./actions/biped_give_weapon";
import { lowerBoundarySetPlayerColor } from "./actions/boundary_set_player_color";
import { lowerBoundarySetVisible } from "./actions/boundary_set_visible";
import { lowerBreakIntoDebugger } from "./actions/break_into_debugger";
import { lowerCreateObject } from "./actions/create_object";
import { lowerCreateTunnel } from "./actions/create_tunnel";
import { lowerDebugForcePlayerViewCount } from "./actions/debug_force_player_view_count";
import { lowerDebuggingEnableTracing } from "./actions/debugging_enable_tracing";
import { lowerDeleteObject } from "./actions/delete_object";
import { lowerDeviceAnimatePosition } from "./actions/device_animate_position";
import { lowerDeviceGetPosition } from "./actions/device_get_position";
import { lowerDeviceGetPower } from "./actions/device_get_power";
import { lowerDeviceSetPosition } from "./actions/device_set_position";
import { lowerDeviceSetPositionImmediate } from "./actions/device_set_position_immediate";
import { lowerDeviceSetPositionTrack } from "./actions/device_set_position_track";
import { lowerDeviceSetPower } from "./actions/device_set_power";
import { lowerEndRound } from "./actions/end_round";
import { lowerGameGriefRecordCustomPenalty } from "./actions/game_grief_record_custom_penalty";
import { lowerGetButtonTime } from "./actions/get_button_time";
import { lowerGetPlayerHoldingObject } from "./actions/get_player_holding_object";
import { lowerGetRandomObject } from "./actions/get_random_object";
import { lowerHideObject } from "./actions/hide_object";
import { lowerHsFunctionCall } from "./actions/hs_function_call";
import { lowerHudPostMessage } from "./actions/hud_post_message";
import { lowerHudWidgetSetIcon } from "./actions/hud_widget_set_icon";
import { lowerHudWidgetSetMeter } from "./actions/hud_widget_set_meter";
import { lowerHudWidgetSetText } from "./actions/hud_widget_set_text";
import { lowerHudWidgetSetValue } from "./actions/hud_widget_set_value";
import { lowerHudWidgetSetVisibility } from "./actions/hud_widget_set_visibility";
import { lowerNavpointSetIcon } from "./actions/navpoint_set_icon";
import { lowerNavpointSetPriority } from "./actions/navpoint_set_priority";
import { lowerNavpointSetText } from "./actions/navpoint_set_text";
import { lowerNavpointSetTimer } from "./actions/navpoint_set_timer";
import { lowerNavpointSetVisible } from "./actions/navpoint_set_visible";
import { lowerNavpointSetVisibleRange } from "./actions/navpoint_set_visible_range";
import { lowerObjectAdjustHealth } from "./actions/object_adjust_health";
import { lowerObjectAdjustMaximumHealth } from "./actions/object_adjust_maximum_health";
import { lowerObjectAdjustMaximumShield } from "./actions/object_adjust_maximum_shield";
import { lowerObjectAdjustShield } from "./actions/object_adjust_shield";
import { lowerObjectAttach } from "./actions/object_attach";
import { lowerObjectBounce } from "./actions/object_bounce";
import { lowerObjectDestroy } from "./actions/object_destroy";
import { lowerObjectDetach } from "./actions/object_detach";
import { lowerObjectFaceObject } from "./actions/object_face_object";
import { lowerObjectGetDistance } from "./actions/object_get_distance";
import { lowerObjectGetHealth } from "./actions/object_get_health";
import { lowerObjectGetOrientation } from "./actions/object_get_orientation";
import { lowerObjectGetShield } from "./actions/object_get_shield";
import { lowerObjectGetVelocity } from "./actions/object_get_velocity";
import { lowerObjectSetInvincibility } from "./actions/object_set_invincibility";
import { lowerObjectSetNeverGarbage } from "./actions/object_set_never_garbage";
import { lowerObjectSetOrientation } from "./actions/object_set_orientation";
import { lowerObjectSetScale } from "./actions/object_set_scale";
import { lowerPlaySound } from "./actions/play_sound";
import { lowerPlayerAdjustMoney } from "./actions/player_adjust_money";
import { lowerPlayerDeathGetDamageType } from "./actions/player_death_get_damage_type";
import { lowerPlayerDeathGetKillingPlayer } from "./actions/player_death_get_killing_player";
import { lowerPlayerDeathGetSpecialType } from "./actions/player_death_get_special_type";
import { lowerPlayerEnablePurchases } from "./actions/player_enable_purchases";
import { lowerPlayerGetEquipment } from "./actions/player_get_equipment";
import { lowerPlayerGetFireteamIndex } from "./actions/player_get_fireteam_index";
import { lowerPlayerGetKillingSpreeCount } from "./actions/player_get_killing_spree_count";
import { lowerPlayerGetPlace } from "./actions/player_get_place";
import { lowerPlayerGetTargetObject } from "./actions/player_get_target_object";
import { lowerPlayerGetVehicle } from "./actions/player_get_vehicle";
import { lowerPlayerGetWeapon } from "./actions/player_get_weapon";
import { lowerPlayerPickUpWeapon } from "./actions/player_pick_up_weapon";
import { lowerPlayerSetCoopSpawning } from "./actions/player_set_coop_spawning";
import { lowerPlayerSetFireteamIndex } from "./actions/player_set_fireteam_index";
import { lowerPlayerSetObjective } from "./actions/player_set_objective";
import { lowerPlayerSetObjectiveAllegiance } from "./actions/player_set_objective_allegiance";
import { lowerPlayerSetObjectiveAllegianceIcon } from "./actions/player_set_objective_allegiance_icon";
import { lowerPlayerSetPrimaryRespawnObject } from "./actions/player_set_primary_respawn_object";
import { lowerPlayerSetRequisitionPalette } from "./actions/player_set_requisition_palette";
import { lowerPlayerSetUnit } from "./actions/player_set_unit";
import { lowerPlayerSetVehicle } from "./actions/player_set_vehicle";
import { lowerPlayerSetVehicleSpawning } from "./actions/player_set_vehicle_spawning";
import { lowerPrintVariable } from "./actions/print_variable";
import { lowerRandom } from "./actions/random";
import { lowerRespawnZoneEnable } from "./actions/respawn_zone_enable";
import { lowerSavedFilmInsertMarker } from "./actions/saved_film_insert_marker";
import { lowerSet } from "./actions/set";
import { lowerSetBoundary } from "./actions/set_boundary";
import { lowerSetFireteamRespawnFilter } from "./actions/set_fireteam_respawn_filter";
import { lowerSetLoadoutPalette } from "./actions/set_loadout_palette";
import { lowerSetPickupFilter } from "./actions/set_pickup_filter";
import { lowerSetPlayerRespawnVehicle } from "./actions/set_player_respawn_vehicle";
import { lowerSetProgressBar } from "./actions/set_progress_bar";
import { lowerSetRespawnFilter } from "./actions/set_respawn_filter";
import { lowerSetScenarioInterpolatorState } from "./actions/set_scenario_interpolator_state";
import { lowerSetScore } from "./actions/set_score";
import { lowerSetTeamRespawnVehicle } from "./actions/set_team_respawn_vehicle";
import { lowerSubmitIncident } from "./actions/submit_incident";
import { lowerSubmitIncidentWithCustomValue } from "./actions/submit_incident_with_custom_value";
import { lowerTeamGetPlace } from "./actions/team_get_place";
import { lowerTeamSetCoopSpawning } from "./actions/team_set_coop_spawning";
import { lowerTeamSetPrimaryRespawnObject } from "./actions/team_set_primary_respawn_object";
import { lowerTeamSetVehicleSpawning } from "./actions/team_set_vehicle_spawning";
import { lowerTimerReset } from "./actions/timer_reset";
import { lowerTimerSetRate } from "./actions/timer_set_rate";
import { lowerWeaponSetPickupPriority } from "./actions/weapon_set_pickup_priority";

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
