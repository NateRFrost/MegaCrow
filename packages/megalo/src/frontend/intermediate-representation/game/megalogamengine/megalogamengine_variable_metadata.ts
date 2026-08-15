import type { MultiplayerTeamDesignator } from "src/frontend/intermediate-representation/game/game_engine_default";
import type { CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";

export const megaloVariableNetworkState = megaloEnum([
  "local",
  "networked",
  "networked_high",
] as const);
export const MegaloVariableNetworkState = megaloVariableNetworkState.enum;
export type MegaloVariableNetworkState = MegaloEnumNames<
  typeof megaloVariableNetworkState
>;

export interface VariableMetadata {
  numericVariables: {
    variable: CustomVariableReference;
    networkState: MegaloVariableNetworkState;
  }[];
  objectVariables: MegaloVariableNetworkState[];
  playerVariables: MegaloVariableNetworkState[];
  teamVariables: {
    value: MultiplayerTeamDesignator;
    networkState: MegaloVariableNetworkState;
  }[];
  timerVariables: CustomVariableReference[];
}
