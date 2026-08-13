import type { SourceLocation } from "src/diagnostics";
import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";

export interface UserDefinedOptionValue {
  description?: StringTableReference;
  name?: StringTableReference;
  value: number;
}

export interface UserDefinedOptionOverride {
  hidden?: boolean;
  location: SourceLocation;
  locked?: boolean;
  target: { kind: "name"; value: string } | { kind: "index"; value: number };
  value: number;
}

export interface PlayerTraitOptionOverride {
  location: SourceLocation;
  target: { kind: "name"; value: string } | { kind: "index"; value: number };
  traits: PlayerTraits;
}

interface UserDefinedOptionBase {
  description?: StringTableReference;
  hidden?: boolean;
  // on compiled gametypes, hide and lock are stored separately from options.
  locked?: boolean;
  name?: StringTableReference;
}

export type RangedUserDefinedOption = UserDefinedOptionBase & {
  defaultValue: UserDefinedOptionValue;
  minValue: UserDefinedOptionValue;
  maxValue: UserDefinedOptionValue;
  currentValue: number;
};

export type SelectUserDefinedOption = UserDefinedOptionBase & {
  values: UserDefinedOptionValue[];
  defaultValueIndex: number;
  currentValueIndex: number;
};

export type UserDefinedOption =
  | RangedUserDefinedOption
  | SelectUserDefinedOption;
