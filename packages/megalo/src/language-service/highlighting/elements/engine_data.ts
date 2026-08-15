import type { EngineDataElementNode } from "src/frontend/abstract-syntax-tree/elements/engine_data";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import { highlightClosedValueParameters } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightEngineData = (
  out: SemanticToken[],
  element: EngineDataElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const property of element.properties) {
    emitLocation(out, property.location, "parameter");
    // Values are mostly refs/strings; no free-keyword enum coloring.
    highlightClosedValueParameters(out, property.parameters, []);
  }
};
