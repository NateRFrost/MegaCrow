import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightOperatorKeyword,
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightSetScore = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  // Parser order: target, operation, value
  let i = highlightTeamOrPlayerTarget(out, p, 0);
  highlightOperatorKeyword(out, p[i]);
  highlightStructural(out, p[i + 1]);
};
