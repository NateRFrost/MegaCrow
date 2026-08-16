import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { highlightStructural } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `set_player_respawn_vehicle <vehicle-type> <player>` — type refs via symbol table. */
export const highlightSetPlayerRespawnVehicle = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightStructural(out, p[1]);
};
