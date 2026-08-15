import type { PlayerRatingElementNode } from "src/frontend/abstract-syntax-tree/elements/player_rating";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightPlayerRating = (
  out: SemanticToken[],
  element: PlayerRatingElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const field of element.fields) {
    emitLocation(out, field.location, "parameter");
  }
};
