import type { ActionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { VariableScope, VariableType } from "src/frontend/symbol-table";

export type VariableLimits = Record<
  VariableScope,
  Partial<Record<VariableType, number>>
>;

export interface Limits {
  actions: number;
  conditions: number;
  objectsUsed: number;
  triggers: number;
  userDefinedOptions: number;
  variables: VariableLimits;
  // TODO: Implement more limits and their checks.
}

export abstract class VersionConfiguration {
  public abstract get limits(): Limits;
  public abstract get objectListNames(): readonly string[];
  public abstract get pregameActions(): readonly ActionType[];
}
