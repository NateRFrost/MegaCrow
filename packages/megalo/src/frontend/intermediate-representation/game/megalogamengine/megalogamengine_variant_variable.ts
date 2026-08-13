import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";

export enum VariableType {
  CustomVariable = 0,
  Player = 1,
  Object = 2,
  Team = 3,
  CustomTimer = 4,
}

interface PlayerVariable {
  player: PlayerReference;
  type: VariableType.Player;
}

interface ObjectVariable {
  object: ObjectReference;
  type: VariableType.Object;
}

interface TeamVariable {
  team: TeamReference;
  type: VariableType.Team;
}

interface CustomTimerVariable {
  customTimer: CustomTimerReference;
  type: VariableType.CustomTimer;
}

interface CustomVariableVariable {
  customVariable: CustomVariableReference;
  type: VariableType.CustomVariable;
}

export type VariantVariable =
  | PlayerVariable
  | ObjectVariable
  | TeamVariable
  | CustomTimerVariable
  | CustomVariableVariable;
