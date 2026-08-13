import { VariableScope, VariableType } from "src/frontend/symbol-table";
import {
  type Limits,
  type VariableLimits,
  VersionConfiguration,
} from "src/backend/version-configuration/version_configuration";

export class VersionConfiguration107MCC extends VersionConfiguration {
  private static readonly VARIABLE_LIMITS: VariableLimits = {
    [VariableScope.Global]: {
      [VariableType.Number]: 12,
      [VariableType.Timer]: 8,
      [VariableType.Team]: 8,
      [VariableType.Player]: 8,
      [VariableType.Object]: 16,
    },
    [VariableScope.Team]: {
      [VariableType.Number]: 8,
      [VariableType.Timer]: 4,
      [VariableType.Team]: 4,
      [VariableType.Player]: 4,
      [VariableType.Object]: 6,
    },
    [VariableScope.Player]: {
      [VariableType.Number]: 8,
      [VariableType.Timer]: 4,
      [VariableType.Team]: 4,
      [VariableType.Player]: 4,
      [VariableType.Object]: 4,
    },
    [VariableScope.Object]: {
      [VariableType.Number]: 8,
      [VariableType.Timer]: 4,
      [VariableType.Team]: 2,
      [VariableType.Player]: 4,
      [VariableType.Object]: 4,
    },
    [VariableScope.Temporary]: {
      [VariableType.Number]: 10,
      [VariableType.Object]: 8,
      [VariableType.Team]: 6,
      [VariableType.Player]: 3,
    },
  };

  public get limits(): Limits {
    return {
      variables: VersionConfiguration107MCC.VARIABLE_LIMITS,
      objectsUsed: 2048,
      triggers: 320,
      conditions: 512,
      actions: 1024,
      userDefinedOptions: 16,
    };
  }
}