import {
  type c_game_engine_custom_variant,
  k_game_variant_parameter_flags,
  type s_game_variant_parameter_flags,
  s_player_trait_option,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { IR } from "../../intermediate-representation";
import type {
  VehicleSet,
  WeaponSet,
} from "../../intermediate-representation/game/game_engine_default";
import type { PlayerTraits } from "../../intermediate-representation/game/game_engine_player_traits";
import type { BuiltInGameOptionFlags } from "../../intermediate-representation/game/parameters";
import { encodeTeamScoringMethod } from "./enums/e_team_scoring_method";
import { encodePlayerTraits } from "./player_traits";

const encodeWeaponSet = (value: WeaponSet): number => {
  switch (value) {
    case "none":
      return -1;
    case "default":
      return -2;
    case "random":
      return -3;
    default:
      return Number(value);
  }
};

const encodeVehicleSet = (value: VehicleSet): number => {
  switch (value) {
    case "none":
      return -1;
    case "default":
      return -2;
    case "random":
      return -3;
    default:
      return Number(value);
  }
};

type ParameterFlagKey = (typeof k_game_variant_parameter_flags)[number];

const snakeToCamel = (name: string): string =>
  name.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());

/** BLF snake_case flag → IR camelCase key (same naming convention as parameters.ts). */
const parameterFlagToIrKey = (
  snakeKey: ParameterFlagKey
): keyof BuiltInGameOptionFlags =>
  snakeToCamel(snakeKey) as keyof BuiltInGameOptionFlags;

/**
 * Copy the presence-based lock/hide flag overrides from the IR onto a BLF
 * bitfield. The IR keys are the camelCase equivalents of the BLF snake_case
 * flag names, and both lists share the same ordering.
 */
const applyParameterFlags = (
  target: s_game_variant_parameter_flags,
  flags: BuiltInGameOptionFlags
): void => {
  for (const snakeKey of k_game_variant_parameter_flags) {
    const value = flags[parameterFlagToIrKey(snakeKey)];
    if (value === true) {
      target[snakeKey] = true;
    }
  }
};

const compilePlayerTraitOption = (
  name: number,
  description: number,
  traits: PlayerTraits
): s_player_trait_option => {
  const option = new s_player_trait_option();
  option.m_name_string_index = name;
  option.m_description_string_index = description;
  encodePlayerTraits(option.m_player_traits, traits);
  return option;
};

/** Compile the base + custom variant game options from the IR into the gametype. */
export const compileGameOptions = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const { gameVariant: irVariant } = ir;
  const base = gameVariant.m_base_variant;
  const {
    baseVariant,
    tu1Settings,
    baseVariantParametersLocked,
    baseVariantParametersHidden,
  } = irVariant;

  if (baseVariant.teamScoringMethod !== undefined) {
    base.m_team_scoring_method = encodeTeamScoringMethod(
      baseVariant.teamScoringMethod
    );
  }

  const misc = base.m_miscellaneous_options;
  const { miscellaneousOptions } = baseVariant;
  if (miscellaneousOptions.teamsEnabled !== undefined) {
    misc.m_teams_enabled = miscellaneousOptions.teamsEnabled;
  }
  if (miscellaneousOptions.roundResetPlayers !== undefined) {
    misc.m_round_reset_players = miscellaneousOptions.roundResetPlayers;
  }
  if (miscellaneousOptions.roundResetMap !== undefined) {
    misc.m_round_reset_map = miscellaneousOptions.roundResetMap;
  }
  if (miscellaneousOptions.perfectionEnabled !== undefined) {
    misc.m_perfection_enabled = miscellaneousOptions.perfectionEnabled;
  }
  if (miscellaneousOptions.roundTimeLimitMinutes !== undefined) {
    misc.m_round_time_limit_minutes =
      miscellaneousOptions.roundTimeLimitMinutes;
  }
  if (miscellaneousOptions.roundCount !== undefined) {
    misc.m_round_limit = miscellaneousOptions.roundCount;
  }
  if (miscellaneousOptions.earlyVictoryWinCount !== undefined) {
    misc.m_early_victory_win_count =
      miscellaneousOptions.earlyVictoryWinCount;
  }
  if (miscellaneousOptions.suddenDeathTimeLimitSeconds !== undefined) {
    misc.m_sudden_death_time =
      miscellaneousOptions.suddenDeathTimeLimitSeconds;
  }
  if (miscellaneousOptions.gracePeriodTimeLimitSeconds !== undefined) {
    misc.m_grace_period = miscellaneousOptions.gracePeriodTimeLimitSeconds;
  }

  const respawn = base.m_respawn_options;
  const { respawnOptions } = baseVariant;
  if (respawnOptions.inheritRespawnTime !== undefined) {
    respawn.m_inherit_respawn_time = respawnOptions.inheritRespawnTime;
  }
  if (respawnOptions.respawnWithTeammate !== undefined) {
    respawn.m_respawn_with_teammate = respawnOptions.respawnWithTeammate;
  }
  if (respawnOptions.respawnAtLocation !== undefined) {
    respawn.m_respawn_at_location = respawnOptions.respawnAtLocation;
  }
  if (respawnOptions.respawnOnKills !== undefined) {
    respawn.m_respawn_on_kills = respawnOptions.respawnOnKills;
  }
  if (respawnOptions.livesPerRound !== undefined) {
    respawn.m_lives_per_round = respawnOptions.livesPerRound;
  }
  if (respawnOptions.teamLivesPerRound !== undefined) {
    respawn.m_team_lives_per_round = respawnOptions.teamLivesPerRound;
  }
  if (respawnOptions.respawnTimeSeconds !== undefined) {
    respawn.m_respawn_time_seconds = respawnOptions.respawnTimeSeconds;
  }
  if (respawnOptions.suicidePenaltySeconds !== undefined) {
    respawn.m_suicide_penalty_seconds = respawnOptions.suicidePenaltySeconds;
  }
  if (respawnOptions.betrayalPenaltySeconds !== undefined) {
    respawn.m_betrayal_penalty_seconds = respawnOptions.betrayalPenaltySeconds;
  }
  if (respawnOptions.respawnGrowthSeconds !== undefined) {
    respawn.m_respawn_growth_seconds = respawnOptions.respawnGrowthSeconds;
  }
  if (respawnOptions.loadoutCamTime !== undefined) {
    respawn.m_loadout_cam_time = respawnOptions.loadoutCamTime;
  }
  if (respawnOptions.respawnPlayerTraitsDurationSeconds !== undefined) {
    respawn.m_respawn_player_traits_duration_seconds =
      respawnOptions.respawnPlayerTraitsDurationSeconds;
  }
  const respawnTraits = respawnOptions.respawnPlayerTraits?.[0];
  if (respawnTraits !== undefined) {
    encodePlayerTraits(respawn.m_respawn_player_traits, respawnTraits);
  }

  const social = base.m_social_options.m_flags;
  const { socialOptions } = baseVariant;
  if (socialOptions.friendlyFireEnabled !== undefined) {
    social.friendly_fire_enabled = socialOptions.friendlyFireEnabled !== 0;
  }
  if (socialOptions.betrayalBootingEnabled !== undefined) {
    social.betrayal_booting_enabled =
      socialOptions.betrayalBootingEnabled !== 0;
  }
  if (socialOptions.enemyVoiceEnabled !== undefined) {
    social.enemy_voice_enabled = socialOptions.enemyVoiceEnabled !== 0;
  }
  if (socialOptions.openChannelVoiceEnabled !== undefined) {
    social.open_channel_voice_enabled =
      socialOptions.openChannelVoiceEnabled !== 0;
  }
  if (socialOptions.deadPlayerVoiceEnabled !== undefined) {
    social.dead_player_voice_enabled =
      socialOptions.deadPlayerVoiceEnabled !== 0;
  }

  const map = base.m_map_override_options;
  const { mapOverrideOptions } = baseVariant;
  if (mapOverrideOptions.grenadesOnMap !== undefined) {
    map.m_flags.grenades_on_map = mapOverrideOptions.grenadesOnMap !== 0;
  }
  if (mapOverrideOptions.shortcutsOnMap !== undefined) {
    map.m_flags.shortcuts_on_map = mapOverrideOptions.shortcutsOnMap;
  }
  if (mapOverrideOptions.equipmentOnMap !== undefined) {
    map.m_flags.equipment_on_map = mapOverrideOptions.equipmentOnMap;
  }
  if (mapOverrideOptions.powerupsOnMap !== undefined) {
    map.m_flags.powerups_on_map = mapOverrideOptions.powerupsOnMap;
  }
  if (mapOverrideOptions.turretsOnMap !== undefined) {
    map.m_flags.turrets_on_map = mapOverrideOptions.turretsOnMap;
  }
  if (mapOverrideOptions.indestructibleVehicles !== undefined) {
    map.m_flags.indestructible_vehicles =
      mapOverrideOptions.indestructibleVehicles !== 0;
  }
  if (mapOverrideOptions.weaponSetAbsoluteIndex !== undefined) {
    map.m_weapon_set_absolute_index = encodeWeaponSet(
      mapOverrideOptions.weaponSetAbsoluteIndex
    );
  }
  if (mapOverrideOptions.vehicleSetAbsoluteIndex !== undefined) {
    map.m_vehicle_set_absolute_index = encodeVehicleSet(
      mapOverrideOptions.vehicleSetAbsoluteIndex
    );
  }
  if (mapOverrideOptions.basePlayerTraits !== undefined) {
    encodePlayerTraits(
      map.m_base_player_traits,
      mapOverrideOptions.basePlayerTraits
    );
  }
  if (mapOverrideOptions.redPowerupTraits !== undefined) {
    encodePlayerTraits(
      map.m_red_powerup_traits,
      mapOverrideOptions.redPowerupTraits
    );
  }
  if (mapOverrideOptions.bluePowerupTraits !== undefined) {
    encodePlayerTraits(
      map.m_blue_powerup_traits,
      mapOverrideOptions.bluePowerupTraits
    );
  }
  if (mapOverrideOptions.yellowPowerupTraits !== undefined) {
    encodePlayerTraits(
      map.m_yellow_powerup_traits,
      mapOverrideOptions.yellowPowerupTraits
    );
  }
  if (mapOverrideOptions.redPowerupDurationSeconds !== undefined) {
    map.m_red_powerup_duration_seconds =
      mapOverrideOptions.redPowerupDurationSeconds;
  }
  if (mapOverrideOptions.bluePowerupDurationSeconds !== undefined) {
    map.m_blue_powerup_duration_seconds =
      mapOverrideOptions.bluePowerupDurationSeconds;
  }
  if (mapOverrideOptions.yellowPowerupDurationSeconds !== undefined) {
    map.m_yellow_powerup_duration_seconds =
      mapOverrideOptions.yellowPowerupDurationSeconds;
  }

  if (irVariant.scoreToWinRound !== undefined) {
    gameVariant.m_score_to_win_round = irVariant.scoreToWinRound;
  }
  if (irVariant.fireTeamsEnabled !== undefined) {
    gameVariant.m_fire_teams_enabled = irVariant.fireTeamsEnabled !== 0;
  }
  if (irVariant.symmetricGametype !== undefined) {
    gameVariant.m_symmetric_gametype = irVariant.symmetricGametype;
  }
  gameVariant.m_player_traits = irVariant.playerTraits.map((option) =>
    compilePlayerTraitOption(
      Number(option.name ?? 0),
      Number(option.description ?? 0),
      option.traits
    )
  );

  const tu1 = gameVariant.m_tu1_settings;
  if (tu1Settings.alwaysSpilloverDamage !== undefined) {
    tu1.m_flags.always_spillover_damage = tu1Settings.alwaysSpilloverDamage;
  }
  if (tu1Settings.armorLockStickiesRemain !== undefined) {
    tu1.m_flags.armor_lock_stickies_remain =
      tu1Settings.armorLockStickiesRemain;
  }
  if (tu1Settings.attachedDamageBypassShields !== undefined) {
    tu1.m_flags.attached_damage_bypass_shields =
      tu1Settings.attachedDamageBypassShields;
  }
  if (tu1Settings.activeCamoOverrideEnergyCurve !== undefined) {
    tu1.m_flags.active_camo_override_energy_curve =
      tu1Settings.activeCamoOverrideEnergyCurve;
  }
  if (tu1Settings.swordGunClangKills !== undefined) {
    tu1.m_flags.sword_gun_clang_kills = tu1Settings.swordGunClangKills;
  }
  if (tu1Settings.magnumIsAutomatic !== undefined) {
    tu1.m_flags.magnum_is_automatic = tu1Settings.magnumIsAutomatic;
  }
  if (tu1Settings.precisionBloom !== undefined) {
    tu1.m_precision_bloom = tu1Settings.precisionBloom;
  }
  if (tu1Settings.armorLockDamageDrain !== undefined) {
    tu1.m_armor_lock_damage_drain = tu1Settings.armorLockDamageDrain;
  }
  if (tu1Settings.armorLockDamageDrainLimit !== undefined) {
    tu1.m_armor_lock_damage_drain_limit =
      tu1Settings.armorLockDamageDrainLimit;
  }
  if (tu1Settings.activeCamoEnergyCurveMin !== undefined) {
    tu1.m_active_camo_energy_curve_min = tu1Settings.activeCamoEnergyCurveMin;
  }
  if (tu1Settings.activeCamoEnergyCurveMax !== undefined) {
    tu1.m_active_camo_energy_curve_max = tu1Settings.activeCamoEnergyCurveMax;
  }
  if (tu1Settings.magnumDamage !== undefined) {
    tu1.m_magnum_damage = tu1Settings.magnumDamage;
  }
  if (tu1Settings.magnumFireDelay !== undefined) {
    tu1.m_magnum_fire_delay = tu1Settings.magnumFireDelay;
  }

  applyParameterFlags(
    gameVariant.m_base_variant_parameters_locked,
    baseVariantParametersLocked
  );
  applyParameterFlags(
    gameVariant.m_base_variant_parameters_hidden,
    baseVariantParametersHidden
  );
};
