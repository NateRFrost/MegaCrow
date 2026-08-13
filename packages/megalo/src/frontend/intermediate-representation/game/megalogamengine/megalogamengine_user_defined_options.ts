import type { SourceLocation } from "../../../../diagnostics";
import type { PlayerTraits } from "../game_engine_player_traits";
import type { StringTableReference } from "../string_table";

export type UserDefinedOptionValue = {
  value: number;
  name?: StringTableReference;
  description?: StringTableReference;
};

export type UserDefinedOptionOverride = {
  target:
    | { kind: "name"; value: string }
    | { kind: "index"; value: number };
  value: number;
  locked?: boolean;
  hidden?: boolean;
  location: SourceLocation;
};

export type PlayerTraitOptionOverride = {
  target:
    | { kind: "name"; value: string }
    | { kind: "index"; value: number };
  traits: PlayerTraits;
  location: SourceLocation;
};

type UserDefinedOptionBase = {
  name?: StringTableReference;
  description?: StringTableReference;
  // on compiled gametypes, hide and lock are stored separately from options.
  locked?: boolean;
  hidden?: boolean;
};

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
