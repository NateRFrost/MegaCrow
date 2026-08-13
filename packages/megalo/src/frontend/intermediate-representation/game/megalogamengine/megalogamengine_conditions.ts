import type {
  CustomTimerReference,
  ObjectReference,
  ObjectTypeReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { VariantVariable } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";

export enum NumericComparison {
  LessThan = 0,
  GreaterThan = 1,
  EqualTo = 2,
  LessThanOrEqualTo = 3,
  GreaterThanOrEqualTo = 4,
  NotEqualTo = 5,
}

export enum ConditionType {
  None = 0,
  If = 1,
  ObjectInArea = 2,
  PlayerDied = 3,
  TeamDisposition = 4,
  TimerExpired = 5,
  ObjectIsType = 6,
  TeamIsActive = 7,
  ObjectOutOfBounds = 8,
  PlayerIsFireTeamLeader = 9,
  PlayerAssistedWithKill = 10,
  ObjectMatchesFilter = 11,
  PlayerIsActive = 12,
  EquipmentIsActive = 13,
  PlayerIsSpartan = 14,
  PlayerIsElite = 15,
  PlayerIsEditor = 16,
  GameIsForge = 17,
}

export interface ConditionIfParameters {
  comparison: NumericComparison;
  left: VariantVariable;
  right: VariantVariable;
}

export interface ConditionObjectInAreaParameters {
  area: ObjectReference;
  object: ObjectReference;
}

export enum PlayerDeathKillerType {
  Environment = 0,
  Suicide = 1,
  Enemy = 2,
  Betrayal = 3,
  QuitGame = 4,
}

export interface PlayerDeathKillerTypeFlags {
  betrayal: boolean;
  enemy: boolean;
  environment: boolean;
  quit_game: boolean;
  suicide: boolean;
}

export interface ConditionPlayerDiedParameters {
  killerType: PlayerDeathKillerTypeFlags;
  player: PlayerReference;
}

export enum Disposition {
  Neutral = 0,
  Friendly = 1,
  Enemy = 2,
}

export interface ConditionTeamDispositionParameters {
  disposition: Disposition;
  team1: TeamReference;
  team2: TeamReference;
}

export interface ConditionTimerExpiredParameters {
  timer: CustomTimerReference;
}

export interface ConditionObjectIsTypeParameters {
  object: ObjectReference;
  objectType: ObjectTypeReference;
}

export interface ConditionTeamIsActiveParameters {
  team: TeamReference;
}

export interface ConditionObjectOutOfBoundsParameters {
  object: ObjectReference;
}

export interface ConditionPlayerIsFireTeamLeaderParameters {
  player: PlayerReference;
}

export interface ConditionPlayerAssistedWithKillParameters {
  player1: PlayerReference;
  player2: PlayerReference;
}

export interface ConditionObjectMatchesFilterParameters {
  filterIndex: number;
  object: ObjectReference;
}

export interface ConditionPlayerIsActiveParameters {
  player: PlayerReference;
}

export interface ConditionEquipmentIsActiveParameters {
  object: ObjectReference;
}

export interface ConditionPlayerIsSpartanParameters {
  player: PlayerReference;
}

export interface ConditionPlayerIsEliteParameters {
  player: PlayerReference;
}

export interface ConditionPlayerIsEditorParameters {
  player: PlayerReference;
}

export type ConditionGameIsForgeParameters = never;

interface ConditionBase {
  executeBeforeAction: number;
  negated: boolean;
  unionGroup: number;
}

interface ConditionParameters<T extends ConditionType, P> {
  parameters: P;
  type: T;
}

export type Condition = ConditionBase &
  (
    | ConditionParameters<ConditionType.If, ConditionIfParameters>
    | ConditionParameters<
        ConditionType.ObjectInArea,
        ConditionObjectInAreaParameters
      >
    | ConditionParameters<
        ConditionType.PlayerDied,
        ConditionPlayerDiedParameters
      >
    | ConditionParameters<
        ConditionType.TeamDisposition,
        ConditionTeamDispositionParameters
      >
    | ConditionParameters<
        ConditionType.TimerExpired,
        ConditionTimerExpiredParameters
      >
    | ConditionParameters<
        ConditionType.ObjectIsType,
        ConditionObjectIsTypeParameters
      >
    | ConditionParameters<
        ConditionType.TeamIsActive,
        ConditionTeamIsActiveParameters
      >
    | ConditionParameters<
        ConditionType.ObjectOutOfBounds,
        ConditionObjectOutOfBoundsParameters
      >
    | ConditionParameters<
        ConditionType.PlayerIsFireTeamLeader,
        ConditionPlayerIsFireTeamLeaderParameters
      >
    | ConditionParameters<
        ConditionType.PlayerAssistedWithKill,
        ConditionPlayerAssistedWithKillParameters
      >
    | ConditionParameters<
        ConditionType.ObjectMatchesFilter,
        ConditionObjectMatchesFilterParameters
      >
    | ConditionParameters<
        ConditionType.PlayerIsActive,
        ConditionPlayerIsActiveParameters
      >
    | ConditionParameters<
        ConditionType.EquipmentIsActive,
        ConditionEquipmentIsActiveParameters
      >
    | ConditionParameters<
        ConditionType.PlayerIsSpartan,
        ConditionPlayerIsSpartanParameters
      >
    | ConditionParameters<
        ConditionType.PlayerIsElite,
        ConditionPlayerIsEliteParameters
      >
    | ConditionParameters<
        ConditionType.PlayerIsEditor,
        ConditionPlayerIsEditorParameters
      >
    | ConditionParameters<
        ConditionType.GameIsForge,
        ConditionGameIsForgeParameters
      >
  );
