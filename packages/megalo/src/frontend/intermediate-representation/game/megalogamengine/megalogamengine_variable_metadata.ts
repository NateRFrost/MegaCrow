import type { MultiplayerTeamDesignator } from "src/frontend/intermediate-representation/game/game_engine_default";
import type { CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";

export enum MegaloVariableNetworkState {
  Local = 0,
  Networked = 1,
  NetworkedHigh = 2,
}

export type VariableMetadata = {
  numericVariables: {
    variable: CustomVariableReference;
    networkState: MegaloVariableNetworkState;
  }[];
  timerVariables: CustomVariableReference[];
  teamVariables: {
    value: MultiplayerTeamDesignator;
    networkState: MegaloVariableNetworkState;
  }[];
  playerVariables: MegaloVariableNetworkState[];
  objectVariables: MegaloVariableNetworkState[];
};
