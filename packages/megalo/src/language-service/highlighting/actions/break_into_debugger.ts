import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {

} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightBreakIntoDebugger = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  void out;
  void p;
};
