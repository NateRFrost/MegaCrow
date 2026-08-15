import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/**
 * `hud_widget_set_meter <widget> off`
 * `hud_widget_set_meter <widget> <timer>`
 * `hud_widget_set_meter <widget> <value> <max>`
 */
export const highlightHudWidgetSetMeter = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  const second = p[1];
  if (
    second !== undefined &&
    second.kind === SyntaxKind.KEYWORD &&
    second.value === "off"
  ) {
    highlightEnumKeyword(out, second, ["off"]);
    return;
  }
  highlightStructural(out, second);
  highlightStructural(out, p[2]);
};
