import {
  type c_game_engine_custom_variant,
  e_megalo_variable_network_state,
  type s_variable_metadata,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { encodeMultiplayerTeamDesignator } from "src/backend/compile/107-mcc/enums/e_multiplayer_team_designator";
import { encodeCustomVariableReference } from "src/backend/compile/107-mcc/references";
import type { IR } from "src/frontend/intermediate-representation";
import {
  MegaloVariableNetworkState,
  type VariableMetadata,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";

const encodeNetworkState = (
  value: MegaloVariableNetworkState
): e_megalo_variable_network_state => {
  switch (value) {
    case MegaloVariableNetworkState.Local:
      return e_megalo_variable_network_state.local;
    case MegaloVariableNetworkState.Networked:
      return e_megalo_variable_network_state.networked;
    case MegaloVariableNetworkState.NetworkedHigh:
      return e_megalo_variable_network_state.networked_high;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};

const populateMetadata = (
  target: s_variable_metadata,
  source: VariableMetadata
): void => {
  target.m_numeric_variables = source.numericVariables.map((entry) => [
    encodeCustomVariableReference(entry.variable),
    encodeNetworkState(entry.networkState),
  ]);
  target.m_timer_variables = source.timerVariables.map(
    encodeCustomVariableReference
  );
  target.m_team_variables = source.teamVariables.map((entry) => [
    encodeMultiplayerTeamDesignator(entry.value),
    encodeNetworkState(entry.networkState),
  ]);
  target.m_player_variables = source.playerVariables.map(encodeNetworkState);
  target.m_object_variables = source.objectVariables.map(encodeNetworkState);
};

/**
 * Writes IR variable metadata into the BLF game engine.
 * Temporary metadata stays IR-only (engine has no temporary metadata block).
 */
export const compileVariableMetadata = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const meta = ir.gameVariant.gameEngine.variableMetadata;
  const engine = gameVariant.m_game_engine;

  populateMetadata(engine.m_global_variable_metadata, meta.global);
  populateMetadata(engine.m_player_variable_metadata, meta.player);
  populateMetadata(engine.m_object_variable_metadata, meta.object);
  populateMetadata(engine.m_team_variable_metadata, meta.team);
};
