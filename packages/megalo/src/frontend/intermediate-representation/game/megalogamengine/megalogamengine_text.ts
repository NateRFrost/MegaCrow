import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";
import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";

export enum ReplaceableTokenType {
  Player = 0,
  Team = 1,
  Object = 2,
  CustomVariable = 3,
  CustomTimer = 4,
}

type PlayerReplaceableToken = {
  type: ReplaceableTokenType.Player;
  player: PlayerReference;
};

type TeamReplaceableToken = {
  type: ReplaceableTokenType.Team;
  team: TeamReference;
};

type ObjectReplaceableToken = {
  type: ReplaceableTokenType.Object;
  object: ObjectReference;
};

type CustomVariableReplaceableToken = {
  type: ReplaceableTokenType.CustomVariable;
  customVariable: CustomVariableReference;
};

type CustomTimerReplaceableToken = {
  type: ReplaceableTokenType.CustomTimer;
  customTimer: CustomTimerReference;
};

export type ReplaceableToken =
  | PlayerReplaceableToken
  | TeamReplaceableToken
  | ObjectReplaceableToken
  | CustomVariableReplaceableToken
  | CustomTimerReplaceableToken;

export type DynamicString = {
  stringIndex: StringTableReference;
  tokens: ReplaceableToken[];
};
