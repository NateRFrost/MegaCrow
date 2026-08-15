import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightParameterOrStructural,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `set_team_respawn_vehicle <object-type> <team>` */
export const highlightSetTeamRespawnVehicle = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightParameterOrStructural(out, p[0]);
  highlightStructural(out, p[1]);
};
