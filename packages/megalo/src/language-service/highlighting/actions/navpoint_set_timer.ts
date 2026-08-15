import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `navpoint_set_timer <object> none|timer` */
export const highlightNavpointSetTimer = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  const timer = p[1];
  if (
    timer !== undefined &&
    timer.kind === SyntaxKind.KEYWORD &&
    timer.value === "none"
  ) {
    highlightEnumKeyword(out, timer, ["none"]);
    return;
  }
  highlightStructural(out, timer);
};
