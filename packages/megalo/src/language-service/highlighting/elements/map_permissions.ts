import type { MapPermissionsElementNode } from "src/frontend/abstract-syntax-tree/elements/map_permissions";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import { highlightEnumKeyword } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const BOOLEAN_KEYWORDS = ["true", "false"] as const;

export const highlightMapPermissions = (
  out: SemanticToken[],
  element: MapPermissionsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const entry of element.entries) {
    if (entry.key === "default") {
      emitLocation(out, entry.location, "parameter");
    } else if (entry.key === "exception") {
      emitLocation(out, entry.location, "keyword");
    }
    if (entry.value.kind === SyntaxKind.KEYWORD) {
      highlightEnumKeyword(out, entry.value, BOOLEAN_KEYWORDS);
    }
  }
};
