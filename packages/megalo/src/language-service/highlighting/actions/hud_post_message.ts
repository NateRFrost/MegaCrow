import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightHudPostMessage = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  const i = highlightTeamOrPlayerTarget(out, p, 0);
  highlightStructural(out, p[i]);
  highlightStructural(out, p[i + 1]);
};
