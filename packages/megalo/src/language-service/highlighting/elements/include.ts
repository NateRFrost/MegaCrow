import type { IncludeElementNode } from "src/frontend/abstract-syntax-tree/elements/include";
import { emitElementKeyword } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightInclude = (
  out: SemanticToken[],
  element: IncludeElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
};
