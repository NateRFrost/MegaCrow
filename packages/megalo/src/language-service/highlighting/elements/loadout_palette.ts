import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { LoadoutPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout_palette";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightLoadoutPalette = (
  out: SemanticToken[],
  element: LoadoutPaletteElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (!isAstErrorNode(element.name)) {
    emitLocation(out, element.name.location, "variable");
  }
};
