import type { LocalizedIncludeElementNode } from "src/frontend/abstract-syntax-tree/elements/localized_include";
import { emitElementKeyword } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightLocalizedInclude = (
  out: SemanticToken[],
  element: LocalizedIncludeElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
};
