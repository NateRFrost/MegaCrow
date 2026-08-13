import {
  CustomVariableType,
  type TypeOnlyCustomVariableReference,
} from "../game/megalogamengine/megalogamengine_references";

/**
 * Maps built-in game option / global names to their concrete CustomVariableType.
 * User-defined options resolve to CustomVariableType.Option instead.
 *
 * Values are constrained to the type-only reference variants, since every entry
 * here is a reference that carries no payload beyond its {@link CustomVariableType}.
 */
export const GAME_OPTION_CUSTOM_VARIABLE_TYPE: Readonly<
  Record<string, TypeOnlyCustomVariableReference["type"]>
> = {
  round_index: CustomVariableType.RoundIndex,
  symmetric_gametype: CustomVariableType.SymmetricGametype,
  object_death_damage_type: CustomVariableType.ObjectDeathDamageType,
  score_to_win_round: CustomVariableType.ScoreToWinRound,
  fire_teams_enabled: CustomVariableType.FireTeamsEnabled,
  teams_enabled: CustomVariableType.TeamsEnabled,
  round_time_limit: CustomVariableType.RoundTimeLimit,
  round_count: CustomVariableType.RoundCount,
  perfection_enabled: CustomVariableType.PerfectionEnabled,
  early_victory_win_count: CustomVariableType.EarlyVictoryWinCount,
  sudden_death_time_limit: CustomVariableType.SuddenDeathTimeLimit,
  grace_period_time_limit: CustomVariableType.GracePeriodTimeLimit,
  lives_per_round: CustomVariableType.LivesPerRound,
  team_lives_per_round: CustomVariableType.TeamLivesPerRound,
  respawn_time: CustomVariableType.RespawnTime,
  suicide_respawn_penalty: CustomVariableType.SuicideRespawnPenalty,
  betrayal_respawn_penalty: CustomVariableType.BetrayalRespawnPenalty,
  respawn_time_growth: CustomVariableType.RespawnTimeGrowth,
  loadout_selection_time: CustomVariableType.LoadoutSelectionTime,
  respawn_traits_duration: CustomVariableType.RespawnTraitsDuration,
  friendly_fire_enabled: CustomVariableType.friendly_fire_enabled,
  betrayal_booting_enabled: CustomVariableType.BetrayalBootingEnabled,
  enemy_voice_enabled: CustomVariableType.EnemyVoiceEnabled,
  open_channel_voice_enabled: CustomVariableType.OpenChannelVoiceEnabled,
  dead_player_voice_enabled: CustomVariableType.DeadPlayerVoiceEnabled,
  grenades_on_map: CustomVariableType.GrenadesOnMap,
  indestructible_vehicles: CustomVariableType.IndestructibleVehicles,
  red_powerup_duration: CustomVariableType.RedPowerupDuration,
  blue_powerup_duration: CustomVariableType.BluePowerupDuration,
  yellow_powerup_duration: CustomVariableType.YellowPowerupDuration,
};

export const resolveGameOptionCustomVariableType = (
  name: string,
  inPregameTrigger: boolean
): TypeOnlyCustomVariableReference["type"] | undefined => {
  if (name === "symmetric_gametype") {
    return inPregameTrigger
      ? CustomVariableType.SymmetricGametypePregame
      : CustomVariableType.SymmetricGametype;
  }
  return GAME_OPTION_CUSTOM_VARIABLE_TYPE[name];
};
