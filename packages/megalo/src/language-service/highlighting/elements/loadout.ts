import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { LoadoutElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import { highlightClosedValueParameters } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightLoadout = (
  out: SemanticToken[],
  element: LoadoutElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (!isAstErrorNode(element.name)) {
    emitLocation(out, element.name.location, "variable");
  }
  for (const item of element.items) {
    emitLocation(out, item.location, "parameter");
    // Weapon/equipment names bind via object-list refs; grenades via structural.
    highlightClosedValueParameters(out, item.parameters, []);
  }
};
