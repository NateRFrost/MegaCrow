import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { highlightParameterKeyword } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightHsFunctionCall = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightParameterKeyword(out, p[0]);
};
