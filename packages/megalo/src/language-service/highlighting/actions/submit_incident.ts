import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightSubmitIncident = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  let i = highlightTeamOrPlayerTarget(out, p, 1);
  highlightTeamOrPlayerTarget(out, p, i);
};
