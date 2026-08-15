import type { ConstantsElementNode } from "src/frontend/abstract-syntax-tree/elements/constants";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightConstants = (
  out: SemanticToken[],
  element: ConstantsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const entry of element.entries) {
    emitLocation(out, entry.type.location, "type");
    emitLocation(out, entry.name.location, "variable");
  }
};
