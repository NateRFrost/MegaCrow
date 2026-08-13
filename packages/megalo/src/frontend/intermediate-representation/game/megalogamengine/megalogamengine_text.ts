import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";

export enum ReplaceableTokenType {
  Player = 0,
  Team = 1,
  Object = 2,
  CustomVariable = 3,
  CustomTimer = 4,
}

interface PlayerReplaceableToken {
  player: PlayerReference;
  type: ReplaceableTokenType.Player;
}

interface TeamReplaceableToken {
  team: TeamReference;
  type: ReplaceableTokenType.Team;
}

interface ObjectReplaceableToken {
  object: ObjectReference;
  type: ReplaceableTokenType.Object;
}

interface CustomVariableReplaceableToken {
  customVariable: CustomVariableReference;
  type: ReplaceableTokenType.CustomVariable;
}

interface CustomTimerReplaceableToken {
  customTimer: CustomTimerReference;
  type: ReplaceableTokenType.CustomTimer;
}

export type ReplaceableToken =
  | PlayerReplaceableToken
  | TeamReplaceableToken
  | ObjectReplaceableToken
  | CustomVariableReplaceableToken
  | CustomTimerReplaceableToken;

export interface DynamicString {
  stringIndex: StringTableReference;
  tokens: ReplaceableToken[];
}
