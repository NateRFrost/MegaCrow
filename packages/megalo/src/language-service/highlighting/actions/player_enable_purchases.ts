import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  purchaseCategory,
  purchaseLifeState,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightPlayerEnablePurchases = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightEnumKeyword(out, p[1], purchaseLifeState);
  highlightEnumKeyword(out, p[2], purchaseCategory);
  highlightStructural(out, p[3]);
};
