import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { HudWidgetsElementNode } from "src/frontend/abstract-syntax-tree/elements/hud_widgets";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightHudWidgets = (
  out: SemanticToken[],
  element: HudWidgetsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const entry of element.entries) {
    if (!isAstErrorNode(entry.name)) {
      emitLocation(out, entry.name.location, "variable");
    }
    if (!isAstErrorNode(entry.position)) {
      emitLocation(out, entry.position.location, "enumMember");
    }
  }
};
