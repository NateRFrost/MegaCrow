import type { StringTableReference } from "../string_table";

export type UserDefinedOptionValue = {
  value: number;
  name?: StringTableReference;
  description?: StringTableReference;
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
