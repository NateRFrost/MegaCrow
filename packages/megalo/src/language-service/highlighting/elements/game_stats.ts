import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { GameStatsElementNode } from "src/frontend/abstract-syntax-tree/elements/game_stats";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import { gameStatisticGrouping } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import { highlightEnumKeyword } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightGameStats = (
  out: SemanticToken[],
  element: GameStatsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const entry of element.entries) {
    if (!isAstErrorNode(entry.name)) {
      emitLocation(out, entry.name.location, "variable");
    }
    if (!isAstErrorNode(entry.type)) {
      emitLocation(out, entry.type.location, "type");
    }
    // Resolved string refs are also colored via highlightSymbol; quoted labels
    // need an explicit emit. Unresolved identifiers stay unstyled.
    if (entry.labelString.kind === SyntaxKind.QUOTED_STRING) {
      emitLocation(out, entry.labelString.location, "string");
    } else if (entry.labelString.kind === SyntaxKind.REFERENCE) {
      emitLocation(out, entry.labelString.location, "variable", ["readonly"]);
    }
    if (!isAstErrorNode(entry.grouping)) {
      highlightEnumKeyword(out, entry.grouping, gameStatisticGrouping);
    }
  }
};
