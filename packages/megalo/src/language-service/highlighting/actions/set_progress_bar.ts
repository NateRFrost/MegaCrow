import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightPlayerFilter,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightSetProgressBar = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  const afterFilter = highlightPlayerFilter(out, p, 1);
  highlightStructural(out, p[afterFilter]);
};
