import type { StringTableElementNode } from "src/frontend/abstract-syntax-tree/elements/string_table";
import { STRING_TABLE_LANGUAGES } from "src/frontend/language-configuration/omni/strings";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

const STRING_TABLE_LANGUAGE_SET = new Set<string>(STRING_TABLE_LANGUAGES);

export const highlightStringTable = (
  out: SemanticToken[],
  element: StringTableElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (
    element.language.value !== "" &&
    STRING_TABLE_LANGUAGE_SET.has(element.language.value)
  ) {
    emitLocation(out, element.language.location, "enumMember");
  }
};
