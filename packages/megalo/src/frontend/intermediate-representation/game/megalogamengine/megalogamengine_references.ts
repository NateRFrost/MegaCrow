import type { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import type { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import type { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";

export enum CustomVariableType {
  Constant = 0,
  PlayerNumber = 1,
  ObjectNumber = 2,
  TeamNumber = 3,
  GlobalNumber = 4,
  Option = 5,
  SpawnObject = 6,
  TeamScore = 7,
  PlayerScore = 8,
  PlayerMoney = 9,
  PlayerRating = 10,
  PlayerStat = 11,
  TeamStat = 12,
  RoundIndex = 13,
  SymmetricGametype = 14,
  SymmetricGametypePregame = 15,
  ScoreToWinRound = 16,
  FireTeamsEnabled = 17,
  TeamsEnabled = 18,
  RoundTimeLimit = 19,
  RoundCount = 20,
  PerfectionEnabled = 21,
  EarlyVictoryWinCount = 22,
  SuddenDeathTimeLimit = 23,
  GracePeriodTimeLimit = 24,
  LivesPerRound = 25,
  TeamLivesPerRound = 26,
  RespawnTime = 27,
  SuicideRespawnPenalty = 28,
  BetrayalRespawnPenalty = 29,
  RespawnTimeGrowth = 30,
  LoadoutSelectionTime = 31,
  RespawnTraitsDuration = 32,
  friendly_fire_enabled = 33,
  BetrayalBootingEnabled = 34,
  EnemyVoiceEnabled = 35,
  OpenChannelVoiceEnabled = 36,
  DeadPlayerVoiceEnabled = 37,
  GrenadesOnMap = 38,
  IndestructibleVehicles = 39,
  RedPowerupDuration = 40,
  BluePowerupDuration = 41,
  YellowPowerupDuration = 42,
  ObjectDeathDamageType = 43,
  TemporaryNumber = 44,
}

interface ConstantCustomVariableReference {
  immediateValue: number;
  type: CustomVariableType.Constant;
}

interface PlayerNumberCustomVariableReference {
  player: ExplicitPlayer;
  type: CustomVariableType.PlayerNumber;
  variableIndex: number;
}

interface ObjectNumberCustomVariableReference {
  object: ExplicitObject;
  type: CustomVariableType.ObjectNumber;
  variableIndex: number;
}

interface TeamNumberCustomVariableReference {
  team: ExplicitTeam;
  type: CustomVariableType.TeamNumber;
  variableIndex: number;
}

interface GlobalNumberCustomVariableReference {
  type: CustomVariableType.GlobalNumber;
  variableIndex: number;
}

interface TemporaryNumberCustomVariableReference {
  type: CustomVariableType.TemporaryNumber;
  variableIndex: number;
}

interface OptionCustomVariableReference {
  optionIndex: number;
  type: CustomVariableType.Option;
}

interface SpawnObjectCustomVariableReference {
  object: ExplicitObject;
  type: CustomVariableType.SpawnObject;
}

interface TeamScoreCustomVariableReference {
  team: ExplicitTeam;
  type: CustomVariableType.TeamScore;
}

interface PlayerScoreCustomVariableReference {
  player: ExplicitPlayer;
  type: CustomVariableType.PlayerScore;
}

interface PlayerMoneyCustomVariableReference {
  player: ExplicitPlayer;
  type: CustomVariableType.PlayerMoney;
}

interface PlayerRatingCustomVariableReference {
  player: ExplicitPlayer;
  type: CustomVariableType.PlayerRating;
}

interface PlayerStatCustomVariableReference {
  player: ExplicitPlayer;
  statisticIndex: number;
  type: CustomVariableType.PlayerStat;
}

interface TeamStatCustomVariableReference {
  statisticIndex: number;
  team: ExplicitTeam;
  type: CustomVariableType.TeamStat;
}

/** Built-in globals and game options that are identified only by their type. */
export interface TypeOnlyCustomVariableReference {
  type:
    | CustomVariableType.RoundIndex
    | CustomVariableType.SymmetricGametype
    | CustomVariableType.SymmetricGametypePregame
    | CustomVariableType.ScoreToWinRound
    | CustomVariableType.FireTeamsEnabled
    | CustomVariableType.TeamsEnabled
    | CustomVariableType.RoundTimeLimit
    | CustomVariableType.RoundCount
    | CustomVariableType.PerfectionEnabled
    | CustomVariableType.EarlyVictoryWinCount
    | CustomVariableType.SuddenDeathTimeLimit
    | CustomVariableType.GracePeriodTimeLimit
    | CustomVariableType.LivesPerRound
    | CustomVariableType.TeamLivesPerRound
    | CustomVariableType.RespawnTime
    | CustomVariableType.SuicideRespawnPenalty
    | CustomVariableType.BetrayalRespawnPenalty
    | CustomVariableType.RespawnTimeGrowth
    | CustomVariableType.LoadoutSelectionTime
    | CustomVariableType.RespawnTraitsDuration
    | CustomVariableType.friendly_fire_enabled
    | CustomVariableType.BetrayalBootingEnabled
    | CustomVariableType.EnemyVoiceEnabled
    | CustomVariableType.OpenChannelVoiceEnabled
    | CustomVariableType.DeadPlayerVoiceEnabled
    | CustomVariableType.GrenadesOnMap
    | CustomVariableType.IndestructibleVehicles
    | CustomVariableType.RedPowerupDuration
    | CustomVariableType.BluePowerupDuration
    | CustomVariableType.YellowPowerupDuration
    | CustomVariableType.ObjectDeathDamageType;
}

export type CustomVariableReference =
  | ConstantCustomVariableReference
  | PlayerNumberCustomVariableReference
  | ObjectNumberCustomVariableReference
  | TeamNumberCustomVariableReference
  | GlobalNumberCustomVariableReference
  | TemporaryNumberCustomVariableReference
  | OptionCustomVariableReference
  | SpawnObjectCustomVariableReference
  | TeamScoreCustomVariableReference
  | PlayerScoreCustomVariableReference
  | PlayerMoneyCustomVariableReference
  | PlayerRatingCustomVariableReference
  | PlayerStatCustomVariableReference
  | TeamStatCustomVariableReference
  | TypeOnlyCustomVariableReference;

export enum PlayerReferenceType {
  GlobalPlayer = 0,
  PlayerPlayer = 1,
  ObjectPlayer = 2,
  TeamPlayer = 3,
}

interface GlobalPlayerReference {
  player: ExplicitPlayer;
  type: PlayerReferenceType.GlobalPlayer;
}

interface PlayerPlayerReference {
  player: ExplicitPlayer;
  type: PlayerReferenceType.PlayerPlayer;
  variableIndex: number;
}

interface ObjectPlayerReference {
  object: ExplicitObject;
  type: PlayerReferenceType.ObjectPlayer;
  variableIndex: number;
}

interface TeamPlayerReference {
  team: ExplicitTeam;
  type: PlayerReferenceType.TeamPlayer;
  variableIndex: number;
}

export type PlayerReference =
  | GlobalPlayerReference
  | PlayerPlayerReference
  | ObjectPlayerReference
  | TeamPlayerReference;

export enum ObjectReferenceType {
  GlobalObject = 0,
  PlayerObject = 1,
  ObjectObject = 2,
  TeamObject = 3,
  PlayerBiped = 4,
  PlayerPlayerBiped = 5,
  ObjectPlayerBiped = 6,
  TeamPlayerBiped = 7,
}

interface GlobalObjectReference {
  object: ExplicitObject;
  type: ObjectReferenceType.GlobalObject;
}

interface PlayerObjectReference {
  player: ExplicitPlayer;
  type: ObjectReferenceType.PlayerObject;
  variableIndex: number;
}

interface ObjectObjectReference {
  object: ExplicitObject;
  type: ObjectReferenceType.ObjectObject;
  variableIndex: number;
}

interface TeamObjectReference {
  team: ExplicitTeam;
  type: ObjectReferenceType.TeamObject;
  variableIndex: number;
}

interface PlayerBipedReference {
  player: ExplicitPlayer;
  type: ObjectReferenceType.PlayerBiped;
}

interface PlayerPlayerBipedReference {
  player: ExplicitPlayer;
  type: ObjectReferenceType.PlayerPlayerBiped;
  variableIndex: number;
}

interface ObjectPlayerBipedReference {
  object: ExplicitObject;
  type: ObjectReferenceType.ObjectPlayerBiped;
  variableIndex: number;
}

interface TeamPlayerBipedReference {
  team: ExplicitTeam;
  type: ObjectReferenceType.TeamPlayerBiped;
  variableIndex: number;
}

export type ObjectReference =
  | GlobalObjectReference
  | PlayerObjectReference
  | ObjectObjectReference
  | TeamObjectReference
  | PlayerBipedReference
  | PlayerPlayerBipedReference
  | ObjectPlayerBipedReference
  | TeamPlayerBipedReference;

export enum TeamReferenceType {
  GlobalTeam = 0,
  PlayerTeam = 1,
  ObjectTeam = 2,
  TeamTeam = 3,
  PlayerOwnerTeam = 4,
  ObjectOwnerTeam = 5,
}

interface GlobalTeamReference {
  team: ExplicitTeam;
  type: TeamReferenceType.GlobalTeam;
}

interface PlayerTeamReference {
  player: ExplicitPlayer;
  type: TeamReferenceType.PlayerTeam;
  variableIndex: number;
}

interface ObjectTeamReference {
  object: ExplicitObject;
  type: TeamReferenceType.ObjectTeam;
  variableIndex: number;
}

interface TeamTeamReference {
  team: ExplicitTeam;
  type: TeamReferenceType.TeamTeam;
  variableIndex: number;
}

interface PlayerOwnerTeamReference {
  player: ExplicitPlayer;
  type: TeamReferenceType.PlayerOwnerTeam;
  variableIndex: number;
}

interface ObjectOwnerTeamReference {
  object: ExplicitObject;
  type: TeamReferenceType.ObjectOwnerTeam;
  variableIndex: number;
}

export type TeamReference =
  | GlobalTeamReference
  | PlayerTeamReference
  | ObjectTeamReference
  | TeamTeamReference
  | PlayerOwnerTeamReference
  | ObjectOwnerTeamReference;

export enum CustomTimerType {
  Global = 0,
  Player = 1,
  Team = 2,
  Object = 3,
  Round = 4,
  SuddenDeath = 5,
  GracePeriod = 6,
}

interface GlobalCustomTimerReference {
  type: CustomTimerType.Global;
  variableIndex: number;
}

interface PlayerCustomTimerReference {
  player: ExplicitPlayer;
  type: CustomTimerType.Player;
  variableIndex: number;
}

interface TeamCustomTimerReference {
  team: ExplicitTeam;
  type: CustomTimerType.Team;
  variableIndex: number;
}

interface ObjectCustomTimerReference {
  object: ExplicitObject;
  type: CustomTimerType.Object;
  variableIndex: number;
}

interface RoundCustomTimerReference {
  type: CustomTimerType.Round;
  variableIndex: number;
}

interface SuddenDeathCustomTimerReference {
  type: CustomTimerType.SuddenDeath;
  variableIndex: number;
}

interface GracePeriodCustomTimerReference {
  type: CustomTimerType.GracePeriod;
  variableIndex: number;
}

export type CustomTimerReference =
  | GlobalCustomTimerReference
  | PlayerCustomTimerReference
  | TeamCustomTimerReference
  | ObjectCustomTimerReference
  | RoundCustomTimerReference
  | SuddenDeathCustomTimerReference
  | GracePeriodCustomTimerReference;

export type ObjectTypeReference = number;
