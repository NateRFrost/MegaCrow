import type {
  c_game_engine_custom_variant,
  s_variable_metadata,
} from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import { e_megalo_variable_network_state } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { encodeMultiplayerTeamDesignator } from "src/backend/compile/49/enums/e_multiplayer_team_designator";
import { encodeCustomVariableReference } from "src/backend/compile/49/references";
import type { IR } from "src/frontend/intermediate-representation";
import {
  MegaloVariableNetworkState,
  type MegaloVariableNetworkState as MegaloVariableNetworkStateName,
  type VariableMetadata,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const NETWORK_STATE_TO_BLF = {
  [MegaloVariableNetworkState.local]: e_megalo_variable_network_state.local,
  [MegaloVariableNetworkState.networked]:
    e_megalo_variable_network_state.networked,
  [MegaloVariableNetworkState.networked_high]:
    e_megalo_variable_network_state.networked_high,
} as const satisfies Record<
  MegaloVariableNetworkStateName,
  e_megalo_variable_network_state
>;

const encodeNetworkState = (
  value: MegaloVariableNetworkStateName
): e_megalo_variable_network_state =>
  mapMegaloEnum(value, NETWORK_STATE_TO_BLF);

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
