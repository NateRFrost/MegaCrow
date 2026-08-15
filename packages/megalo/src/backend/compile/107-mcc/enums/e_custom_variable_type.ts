import { e_custom_variable_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { CustomVariableType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";

const CUSTOM_VARIABLE_TYPE_TO_BLF = {
  [CustomVariableType.Constant]: e_custom_variable_type.constant,
  [CustomVariableType.PlayerNumber]: e_custom_variable_type.player_number,
  [CustomVariableType.ObjectNumber]: e_custom_variable_type.object_number,
  [CustomVariableType.TeamNumber]: e_custom_variable_type.team_number,
  [CustomVariableType.GlobalNumber]: e_custom_variable_type.global_number,
  [CustomVariableType.Option]: e_custom_variable_type.option,
  [CustomVariableType.SpawnObject]: e_custom_variable_type.spawn_object,
  [CustomVariableType.TeamScore]: e_custom_variable_type.team_score,
  [CustomVariableType.PlayerScore]: e_custom_variable_type.player_score,
  [CustomVariableType.PlayerMoney]: e_custom_variable_type.player_money,
  [CustomVariableType.PlayerRating]: e_custom_variable_type.player_rating,
  [CustomVariableType.PlayerStat]: e_custom_variable_type.player_stat,
  [CustomVariableType.TeamStat]: e_custom_variable_type.team_stat,
  [CustomVariableType.RoundIndex]: e_custom_variable_type.round_index,
  [CustomVariableType.SymmetricGametype]:
    e_custom_variable_type.symmetric_gametype,
  [CustomVariableType.SymmetricGametypePregame]:
    e_custom_variable_type.symmetric_gametype_pregame,
  [CustomVariableType.ScoreToWinRound]:
    e_custom_variable_type.score_to_win_round,
  [CustomVariableType.FireTeamsEnabled]:
    e_custom_variable_type.fire_teams_enabled,
  [CustomVariableType.TeamsEnabled]: e_custom_variable_type.teams_enabled,
  [CustomVariableType.RoundTimeLimit]: e_custom_variable_type.round_time_limit,
  [CustomVariableType.RoundCount]: e_custom_variable_type.round_count,
  [CustomVariableType.PerfectionEnabled]:
    e_custom_variable_type.perfection_enabled,
  [CustomVariableType.EarlyVictoryWinCount]:
    e_custom_variable_type.early_victory_win_count,
  [CustomVariableType.SuddenDeathTimeLimit]:
    e_custom_variable_type.sudden_death_time_limit,
  [CustomVariableType.GracePeriodTimeLimit]:
    e_custom_variable_type.grace_period_time_limit,
  [CustomVariableType.LivesPerRound]: e_custom_variable_type.lives_per_round,
  [CustomVariableType.TeamLivesPerRound]:
    e_custom_variable_type.team_lives_per_round,
  [CustomVariableType.RespawnTime]: e_custom_variable_type.respawn_time,
  [CustomVariableType.SuicideRespawnPenalty]:
    e_custom_variable_type.suicide_respawn_penalty,
  [CustomVariableType.BetrayalRespawnPenalty]:
    e_custom_variable_type.betrayal_respawn_penalty,
  [CustomVariableType.RespawnTimeGrowth]:
    e_custom_variable_type.respawn_time_growth,
  [CustomVariableType.LoadoutSelectionTime]:
    e_custom_variable_type.loadout_selection_time,
  [CustomVariableType.RespawnTraitsDuration]:
    e_custom_variable_type.respawn_traits_duration,
  [CustomVariableType.friendly_fire_enabled]:
    e_custom_variable_type.friendly_fire_enabled,
  [CustomVariableType.BetrayalBootingEnabled]:
    e_custom_variable_type.betrayal_booting_enabled,
  [CustomVariableType.EnemyVoiceEnabled]:
    e_custom_variable_type.enemy_voice_enabled,
  [CustomVariableType.OpenChannelVoiceEnabled]:
    e_custom_variable_type.open_channel_voice_enabled,
  [CustomVariableType.DeadPlayerVoiceEnabled]:
    e_custom_variable_type.dead_player_voice_enabled,
  [CustomVariableType.GrenadesOnMap]: e_custom_variable_type.grenades_on_map,
  [CustomVariableType.IndestructibleVehicles]:
    e_custom_variable_type.indestructible_vehicles,
  [CustomVariableType.RedPowerupDuration]:
    e_custom_variable_type.red_powerup_duration,
  [CustomVariableType.BluePowerupDuration]:
    e_custom_variable_type.blue_powerup_duration,
  [CustomVariableType.YellowPowerupDuration]:
    e_custom_variable_type.yellow_powerup_duration,
  [CustomVariableType.ObjectDeathDamageType]:
    e_custom_variable_type.object_death_damage_type,
  [CustomVariableType.TemporaryNumber]:
    e_custom_variable_type.temporary_number,
} as const satisfies Record<CustomVariableType, e_custom_variable_type>;

export const encodeCustomVariableType = (
  value: CustomVariableType
): e_custom_variable_type => CUSTOM_VARIABLE_TYPE_TO_BLF[value];
