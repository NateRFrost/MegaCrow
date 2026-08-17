import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { LoadoutPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout_palette";
import { emitLocation } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightLoadoutPalette = (
  out: SemanticToken[],
  element: LoadoutPaletteElementNode
): void => {
  emitLocation(out, element.keywordLocation, "type");
  if (!isAstErrorNode(element.name)) {
    emitLocation(out, element.name.location, "variable", ["readonly"]);
  }
  for (const item of element.items) {
    emitLocation(out, item.location, "parameter");
  }
};
