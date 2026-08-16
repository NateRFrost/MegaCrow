import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  type CustomTimerReference,
  CustomTimerType,
  type CustomVariableReference,
  CustomVariableType,
  type ObjectReference,
  ObjectReferenceType,
  type PlayerReference,
  PlayerReferenceType,
  type TeamReference,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";

/** MegaloEdit: temps / current_* / death refs banned in persistent dynamic strings. */
export const isTransientExplicitPlayer = (player: ExplicitPlayer): boolean =>
  player === ExplicitPlayer.Current ||
  player === ExplicitPlayer.Killer ||
  (player >= ExplicitPlayer.Temporary0 && player <= ExplicitPlayer.Temporary2);

export const isTransientExplicitObject = (object: ExplicitObject): boolean =>
  object === ExplicitObject.Current ||
  object === ExplicitObject.Killed ||
  object === ExplicitObject.Killer ||
  (object >= ExplicitObject.Temporary0 && object <= ExplicitObject.Temporary7);

export const isTransientExplicitTeam = (team: ExplicitTeam): boolean =>
  team === ExplicitTeam.CurrentTeam ||
  (team >= ExplicitTeam.Temporary0 && team <= ExplicitTeam.Temporary5);

const isTransientPlayerReference = (ref: PlayerReference): boolean => {
  switch (ref.type) {
    case PlayerReferenceType.GlobalPlayer:
    case PlayerReferenceType.PlayerPlayer:
      return isTransientExplicitPlayer(ref.player);
    case PlayerReferenceType.ObjectPlayer:
      return isTransientExplicitObject(ref.object);
    case PlayerReferenceType.TeamPlayer:
      return isTransientExplicitTeam(ref.team);
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

const isTransientObjectReference = (ref: ObjectReference): boolean => {
  switch (ref.type) {
    case ObjectReferenceType.GlobalObject:
    case ObjectReferenceType.ObjectObject:
      return isTransientExplicitObject(ref.object);
    case ObjectReferenceType.PlayerObject:
    case ObjectReferenceType.PlayerBiped:
    case ObjectReferenceType.PlayerPlayerBiped:
      return isTransientExplicitPlayer(ref.player);
    case ObjectReferenceType.TeamObject:
    case ObjectReferenceType.TeamPlayerBiped:
      return isTransientExplicitTeam(ref.team);
    case ObjectReferenceType.ObjectPlayerBiped:
      return isTransientExplicitObject(ref.object);
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

const isTransientTeamReference = (ref: TeamReference): boolean => {
  switch (ref.type) {
    case TeamReferenceType.GlobalTeam:
    case TeamReferenceType.TeamTeam:
      return isTransientExplicitTeam(ref.team);
    case TeamReferenceType.PlayerTeam:
    case TeamReferenceType.PlayerOwnerTeam:
      return isTransientExplicitPlayer(ref.player);
    case TeamReferenceType.ObjectTeam:
    case TeamReferenceType.ObjectOwnerTeam:
      return isTransientExplicitObject(ref.object);
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

const isTransientCustomVariable = (ref: CustomVariableReference): boolean => {
  switch (ref.type) {
    // Bare temporary numbers are allowed in persistent strings (MegaloEdit).
    case CustomVariableType.TemporaryNumber:
    case CustomVariableType.Constant:
    case CustomVariableType.GlobalNumber:
    case CustomVariableType.Option:
      return false;
    case CustomVariableType.PlayerNumber:
    case CustomVariableType.PlayerScore:
    case CustomVariableType.PlayerMoney:
    case CustomVariableType.PlayerRating:
    case CustomVariableType.PlayerStat:
      return isTransientExplicitPlayer(ref.player);
    case CustomVariableType.ObjectNumber:
    case CustomVariableType.SpawnObject:
      return isTransientExplicitObject(ref.object);
    case CustomVariableType.TeamNumber:
    case CustomVariableType.TeamScore:
    case CustomVariableType.TeamStat:
      return isTransientExplicitTeam(ref.team);
    default:
      // Type-only builtins / overrides are persistent.
      return false;
  }
};

const isTransientCustomTimer = (ref: CustomTimerReference): boolean => {
  switch (ref.type) {
    case CustomTimerType.Player:
      return isTransientExplicitPlayer(ref.player);
    case CustomTimerType.Object:
      return isTransientExplicitObject(ref.object);
    case CustomTimerType.Team:
      return isTransientExplicitTeam(ref.team);
    case CustomTimerType.Global:
    case CustomTimerType.Round:
    case CustomTimerType.SuddenDeath:
    case CustomTimerType.GracePeriod:
      return false;
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

/**
 * Whether a dynamic-string replacement is "transient" under MegaloEdit's
 * ReadingPersistentDynamicString rules (temps, current_*, death event refs,
 * and member roots that nest those). Bare temporary numbers are allowed.
 */
export const isTransientVariantVariable = (
  variant: VariantVariable
): boolean => {
  switch (variant.type) {
    case VariantVariableType.CustomVariable:
      return isTransientCustomVariable(variant.customVariable);
    case VariantVariableType.Player:
      return isTransientPlayerReference(variant.player);
    case VariantVariableType.Object:
      return isTransientObjectReference(variant.object);
    case VariantVariableType.Team:
      return isTransientTeamReference(variant.team);
    case VariantVariableType.CustomTimer:
      return isTransientCustomTimer(variant.customTimer);
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
};
