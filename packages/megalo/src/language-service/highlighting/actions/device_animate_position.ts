import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { highlightStructural } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightDeviceAnimatePosition = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightStructural(out, p[1]);
  highlightStructural(out, p[2]);
  highlightStructural(out, p[3]);
  highlightStructural(out, p[4]);
};
