import {
  type c_game_engine_custom_variant,
  type c_game_engine_team_options_team,
  type c_loadout_traits,
  k_game_variant_parameter_flags,
  type s_game_variant_parameter_flags,
  s_player_trait_option,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { IR } from "../../intermediate-representation";
import type {
  Color,
  GameEngineTeamOptionsTeam,
  LoadoutTraits,
  VehicleSet,
  WeaponSet,
} from "../../intermediate-representation/game/game_engine_default";
import type { PlayerTraits } from "../../intermediate-representation/game/game_engine_player_traits";
import type { BuiltInGameOptionFlags } from "../../intermediate-representation/game/parameters";
import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";
import { encodeGrenadeCountSetting } from "./enums";
import { encodePlayerTraits } from "./player_traits";

/** Assign `value` to `target[key]` only when the IR provides the option. */

const assign = <Target, Key extends keyof Target>(
  target: Target,
  key: Key,
  value: number | boolean | string | undefined
): void => {
  if (value !== undefined) {
    target[key] = value as Target[Key];
  }
};

const assignBoolean = <Target, Key extends keyof Target>(
  target: Target,
  key: Key,
  value: number | boolean | undefined
): void => {
  if (value !== undefined) {
    target[key] = Boolean(value) as Target[Key];
  }
};

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

/** Pack an RGB {@link Color} into the 0xRRGGBB integer the compiled format uses. */

const encodeColor = (color: Color): number =>
  ((color.r & 0xff) << 16) | ((color.g & 0xff) << 8) | (color.b & 0xff);

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

const compileTeamOption = (
  target: c_game_engine_team_options_team,
  team: GameEngineTeamOptionsTeam
): void => {
  target.m_team_enabled = true;
  assign(target, "m_team_initial_designator", team.designator);
  assign(target, "m_model_override", team.model);
  assign(target, "m_fireteam_count", team.fireteamCount);
  if (team.teamColor !== undefined) {
    target.m_override_color_armour = true;
    target.m_team_color_override = encodeColor(team.teamColor);
  }
  if (team.name !== undefined) {
    // Team names live in the per-team string table, not the script strings.
    target.m_name.strings = STRING_TABLE_LANGUAGES.map((language) => [
      team.name![language] ?? null,
    ]);
  }
};

const compileLoadout = (
  target: c_loadout_traits,
  loadout: LoadoutTraits
): void => {
  target.m_visible = true;
  if (loadout.name !== undefined) {
    target.m_name = Number(loadout.name);
  }
  assign(
    target,
    "m_initial_primary_weapon_absolute_index",
    loadout.initialPrimaryWeaponAbsoluteIndex
  );
  assign(
    target,
    "m_initial_secondary_weapon_absolute_index",
    loadout.initialSecondaryWeaponAbsoluteIndex
  );
  assign(
    target,
    "m_initial_equipment_absolute_index",
    loadout.initialEquipmentAbsoluteIndex
  );
  if (loadout.initialGrenadeCountSetting !== undefined) {
    target.m_initial_grenade_count_setting = encodeGrenadeCountSetting(
      loadout.initialGrenadeCountSetting
    );
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
    playerRatings,
    tu1Settings,
    baseVariantParametersLocked,
    baseVariantParametersHidden,
  } = irVariant;
  assign(base, "m_team_scoring_method", baseVariant.teamScoringMethod);
  const misc = base.m_miscellaneous_options;
  const { miscellaneousOptions } = baseVariant;
  assign(misc, "m_teams_enabled", miscellaneousOptions.teamsEnabled);
  assign(misc, "m_round_reset_players", miscellaneousOptions.roundResetPlayers);
  assign(misc, "m_round_reset_map", miscellaneousOptions.roundResetMap);
  assign(misc, "m_perfection_enabled", miscellaneousOptions.perfectionEnabled);
  assign(
    misc,
    "m_round_time_limit_minutes",
    miscellaneousOptions.roundTimeLimitMinutes
  );
  assign(misc, "m_round_limit", miscellaneousOptions.roundCount);
  assign(
    misc,
    "m_early_victory_win_count",
    miscellaneousOptions.earlyVictoryWinCount
  );
  assign(
    misc,
    "m_sudden_death_time",
    miscellaneousOptions.suddenDeathTimeLimitSeconds
  );
  assign(
    misc,
    "m_grace_period",
    miscellaneousOptions.gracePeriodTimeLimitSeconds
  );
  const respawn = base.m_respawn_options;
  const { respawnOptions } = baseVariant;
  assign(respawn, "m_inherit_respawn_time", respawnOptions.inheritRespawnTime);
  assign(
    respawn,
    "m_respawn_with_teammate",
    respawnOptions.respawnWithTeammate
  );
  assign(respawn, "m_respawn_at_location", respawnOptions.respawnAtLocation);
  assign(respawn, "m_respawn_on_kills", respawnOptions.respawnOnKills);
  assign(respawn, "m_lives_per_round", respawnOptions.livesPerRound);
  assign(respawn, "m_team_lives_per_round", respawnOptions.teamLivesPerRound);
  assign(respawn, "m_respawn_time_seconds", respawnOptions.respawnTimeSeconds);
  assign(
    respawn,
    "m_suicide_penalty_seconds",
    respawnOptions.suicidePenaltySeconds
  );
  assign(
    respawn,
    "m_betrayal_penalty_seconds",
    respawnOptions.betrayalPenaltySeconds
  );
  assign(
    respawn,
    "m_respawn_growth_seconds",
    respawnOptions.respawnGrowthSeconds
  );
  assign(respawn, "m_loadout_cam_time", respawnOptions.loadoutCamTime);
  assign(
    respawn,
    "m_respawn_player_traits_duration_seconds",
    respawnOptions.respawnPlayerTraitsDurationSeconds
  );
  const respawnTraits = respawnOptions.respawnPlayerTraits?.[0];
  if (respawnTraits !== undefined) {
    encodePlayerTraits(respawn.m_respawn_player_traits, respawnTraits);
  }
  const social = base.m_social_options.m_flags;
  const { socialOptions } = baseVariant;
  assignBoolean(
    social,
    "friendly_fire_enabled",
    socialOptions.friendlyFireEnabled
  );
  assignBoolean(
    social,
    "betrayal_booting_enabled",
    socialOptions.betrayalBootingEnabled
  );
  assignBoolean(social, "enemy_voice_enabled", socialOptions.enemyVoiceEnabled);
  assignBoolean(
    social,
    "open_channel_voice_enabled",
    socialOptions.openChannelVoiceEnabled
  );
  assignBoolean(
    social,
    "dead_player_voice_enabled",
    socialOptions.deadPlayerVoiceEnabled
  );
  const map = base.m_map_override_options;
  const { mapOverrideOptions } = baseVariant;
  assignBoolean(map.m_flags, "grenades_on_map", mapOverrideOptions.grenadesOnMap);
  assignBoolean(
    map.m_flags,
    "shortcuts_on_map",
    mapOverrideOptions.shortcutsOnMap
  );
  assignBoolean(
    map.m_flags,
    "equipment_on_map",
    mapOverrideOptions.equipmentOnMap
  );
  assignBoolean(map.m_flags, "powerups_on_map", mapOverrideOptions.powerupsOnMap);
  assignBoolean(map.m_flags, "turrets_on_map", mapOverrideOptions.turretsOnMap);
  assignBoolean(
    map.m_flags,
    "indestructible_vehicles",
    mapOverrideOptions.indestructibleVehicles
  );
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
  assign(
    map,
    "m_red_powerup_duration_seconds",
    mapOverrideOptions.redPowerupDurationSeconds
  );
  assign(
    map,
    "m_blue_powerup_duration_seconds",
    mapOverrideOptions.bluePowerupDurationSeconds
  );
  assign(
    map,
    "m_yellow_powerup_duration_seconds",
    mapOverrideOptions.yellowPowerupDurationSeconds
  );
  const teamOptions = base.m_team_options;
  const { teamOptions: irTeamOptions } = baseVariant;
  assign(teamOptions, "m_model_override", irTeamOptions.model);
  assign(
    teamOptions,
    "m_designator_switch_type",
    irTeamOptions.designatorSwitchType
  );
  irTeamOptions.teams?.forEach((team, index) => {
    const target = teamOptions.m_teams[index];
    if (target !== undefined) {
      compileTeamOption(target, team);
    }
  });
  const loadouts = base.m_loadouts;
  const { loadoutTraits } = baseVariant;
  assignBoolean(
    loadouts.m_flags,
    "spartan_loadouts_enabled",
    loadoutTraits.spartanLoadoutsEnabled
  );
  assignBoolean(
    loadouts.m_flags,
    "elite_loadouts_enabled",
    loadoutTraits.eliteLoadoutsEnabled
  );
  loadoutTraits.loadoutPalettes?.forEach((palette, paletteIndex) => {
    const targetPalette = loadouts.m_loadout_palettes[paletteIndex];
    if (targetPalette === undefined) {
      return;
    }
    palette.loadouts?.forEach((loadout, loadoutIndex) => {
      const targetLoadout = targetPalette.m_loadouts[loadoutIndex];
      if (targetLoadout !== undefined) {
        compileLoadout(targetLoadout, loadout);
      }
    });
  });
  assign(gameVariant, "m_score_to_win_round", irVariant.scoreToWinRound);
  assignBoolean(gameVariant, "m_fire_teams_enabled", irVariant.fireTeamsEnabled);
  assign(gameVariant, "m_symmetric_gametype", irVariant.symmetricGametype);
  gameVariant.m_player_traits = irVariant.playerTraits.map((option) =>
    compilePlayerTraitOption(
      Number(option.name ?? 0),
      Number(option.description ?? 0),
      option.traits
    )
  );
  if (playerRatings !== undefined) {
    const ratings = gameVariant.m_player_ratings;
    assign(ratings, "m_rating_scale", playerRatings.ratingScale);
    assign(ratings, "m_kill_weight", playerRatings.killWeight);
    assign(ratings, "m_assist_weight", playerRatings.assistWeight);
    assign(ratings, "m_betrayal_weight", playerRatings.betrayalWeight);
    assign(ratings, "m_death_weight", playerRatings.deathWeight);
    assignBoolean(
      ratings,
      "m_normalize_by_max_kills",
      playerRatings.normalizeByMaxKills
    );
    assign(ratings, "m_base", playerRatings.base);
    assign(ratings, "m_range", playerRatings.range);
    assign(ratings, "m_loss_scalar", playerRatings.lossScalar);
    assign(ratings, "m_custom_stat_0", playerRatings.customStat0);
    assign(ratings, "m_custom_stat_1", playerRatings.customStat1);
    assign(ratings, "m_custom_stat_2", playerRatings.customStat2);
    assign(ratings, "m_custom_stat_3", playerRatings.customStat3);
    assign(ratings, "m_expansion_0", playerRatings.expansion0);
    assign(ratings, "m_expansion_1", playerRatings.expansion1);
    assign(ratings, "m_show_in_scoreboard", playerRatings.showInScoreboard);
  }
  const tu1 = gameVariant.m_tu1_settings;
  assignBoolean(
    tu1.m_flags,
    "always_spillover_damage",
    tu1Settings.alwaysSpilloverDamage
  );
  assignBoolean(
    tu1.m_flags,
    "armor_lock_stickies_remain",
    tu1Settings.armorLockStickiesRemain
  );
  assignBoolean(
    tu1.m_flags,
    "attached_damage_bypass_shields",
    tu1Settings.attachedDamageBypassShields
  );
  assignBoolean(
    tu1.m_flags,
    "active_camo_override_energy_curve",
    tu1Settings.activeCamoOverrideEnergyCurve
  );
  assignBoolean(
    tu1.m_flags,
    "sword_gun_clang_kills",
    tu1Settings.swordGunClangKills
  );
  assignBoolean(tu1.m_flags, "magnum_is_automatic", tu1Settings.magnumIsAutomatic);
  assign(tu1, "m_precision_bloom", tu1Settings.precisionBloom);
  assign(tu1, "m_armor_lock_damage_drain", tu1Settings.armorLockDamageDrain);
  assign(
    tu1,
    "m_armor_lock_damage_drain_limit",
    tu1Settings.armorLockDamageDrainLimit
  );
  assign(
    tu1,
    "m_active_camo_energy_curve_min",
    tu1Settings.activeCamoEnergyCurveMin
  );
  assign(
    tu1,
    "m_active_camo_energy_curve_max",
    tu1Settings.activeCamoEnergyCurveMax
  );
  assign(tu1, "m_magnum_damage", tu1Settings.magnumDamage);
  assign(tu1, "m_magnum_fire_delay", tu1Settings.magnumFireDelay);
  applyParameterFlags(
    gameVariant.m_base_variant_parameters_locked,
    baseVariantParametersLocked
  );
  applyParameterFlags(
    gameVariant.m_base_variant_parameters_hidden,
    baseVariantParametersHidden
  );
};
