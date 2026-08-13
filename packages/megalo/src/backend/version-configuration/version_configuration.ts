import { VariableScope, VariableType } from "src/frontend/symbol-table";

export type VariableLimits = Record<
  VariableScope,
  Partial<Record<VariableType, number>>
>;

export type Limits = {
  variables: VariableLimits;
  objectsUsed: number;
  triggers: number;
  conditions: number;
  actions: number;
  userDefinedOptions: number;
  // TODO: Implement more limits and their checks.
};

export abstract class VersionConfiguration {
  public abstract get limits(): Limits;
}
