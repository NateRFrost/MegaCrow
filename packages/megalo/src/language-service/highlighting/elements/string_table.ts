import type { StringTableElementNode } from "src/frontend/abstract-syntax-tree/elements/string_table";
import { emitElementKeyword } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightStringTable = (
  out: SemanticToken[],
  element: StringTableElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
};
