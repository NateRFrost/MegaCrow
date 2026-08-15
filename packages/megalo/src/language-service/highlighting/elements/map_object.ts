import type { MapObjectElementNode } from "src/frontend/abstract-syntax-tree/elements/map_object";
import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightMapObject = (
  out: SemanticToken[],
  element: MapObjectElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (!isAstErrorNode(element.filterName)) {
    emitLocation(out, element.filterName.location, "variable");
  }
  for (const property of element.properties) {
    emitLocation(out, property.location, "parameter");
  }
};
