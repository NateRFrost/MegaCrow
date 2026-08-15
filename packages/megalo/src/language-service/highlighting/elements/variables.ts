import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { VariablesElementNode } from "src/frontend/abstract-syntax-tree/elements/variables";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightVariables = (
  out: SemanticToken[],
  element: VariablesElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);

  if (!isAstErrorNode(element.scope)) {
    emitLocation(
      out,
      element.scope.location,
      element.scope.value === "global" ? "keyword" : "type"
    );
  }

  for (const entry of element.entries) {
    if (!isAstErrorNode(entry.network)) {
      emitLocation(out, entry.network.location, "modifier");
    }
    if (!isAstErrorNode(entry.type)) {
      emitLocation(out, entry.type.location, "type");
    }
  }
};
