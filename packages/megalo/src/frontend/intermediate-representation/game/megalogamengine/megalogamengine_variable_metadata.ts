import type { MultiplayerTeamDesignator } from "src/frontend/intermediate-representation/game/game_engine_default";
import type { CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";

export enum MegaloVariableNetworkState {
  Local = 0,
  Networked = 1,
  NetworkedHigh = 2,
}

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
