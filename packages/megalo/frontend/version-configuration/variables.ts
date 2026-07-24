import { VariableScope, VariableType } from "../symbol-table";

/** Per-(scope, type) maximum slot counts for a megalo version. */
export type VariableLimits = Record<
  VariableScope,
  Partial<Record<VariableType, number>>
>;
