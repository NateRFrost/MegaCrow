import type { BaseElementNode } from "src/frontend/abstract-syntax-tree/elements/base";
import { emitElementKeyword } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightBase = (
  out: SemanticToken[],
  element: BaseElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
};
