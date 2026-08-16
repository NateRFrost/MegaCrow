import type { ActionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { VariableScope, VariableType } from "src/frontend/symbol-table";

export type VariableLimits = Record<
  VariableScope,
  Partial<Record<VariableType, number>>
>;

/**
 * Compile-time resource caps for a Megalo version.
 * Use `0` for resources that do not exist / are unused on that build so UIs can hide them.
 */
export interface Limits {
  actions: number;
  conditions: number;
  /** Encoded variant bitstream size (bytes). */
  encodedSize: number;
  gameStatistics: number;
  hudWidgets: number;
  loadoutPalettes: number;
  loadouts: number;
  mapPermissionExceptions: number;
  objectFilters: number;
  objectsUsed: number;
  playerTraitSets: number;
  /** Set to 0 when requisition is unused/deprecated (e.g. Reach MCC). */
  requisitionPalettes: number;
  stringBytes: number;
  strings: number;
  teams: number;
  triggers: number;
  userDefinedOptions: number;
  variables: VariableLimits;
}

export abstract class VersionConfiguration {
  public abstract get limits(): Limits;
  public abstract get objectListNames(): readonly string[];
  public abstract get pregameActions(): readonly ActionType[];
}
