import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightEnumOrStructural,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `hud_widget_set_icon <widget> none|<icon>` — icons come from the object list. */
export const highlightHudWidgetSetIcon = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightEnumOrStructural(out, p[1], ["none"]);
};
