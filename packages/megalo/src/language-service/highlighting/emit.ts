import type { SourceCodeLocation } from "src/diagnostics";
import type {
  SemanticToken,
  SemanticTokenModifier,
  SemanticTokenType,
} from "src/language-service/highlighting/types";
import {
  isRootDocumentLocation,
  singleLineSpanLength,
} from "src/language-service/position";

export const emitLocation = (
  out: SemanticToken[],
  location: SourceCodeLocation,
  type: SemanticTokenType,
  modifiers: SemanticTokenModifier[] = []
): void => {
  if (!isRootDocumentLocation(location)) {
    return;
  }
  const length = singleLineSpanLength(location);
  if (length <= 0) {
    return;
  }
  out.push({
    line: location.start.line - 1,
    startChar: location.start.column - 1,
    length,
    type,
    modifiers,
  });
};

/** Keyword span from `from` start up to (not including) `until` start, same line. */
export const emitKeywordRange = (
  out: SemanticToken[],
  from: SourceCodeLocation,
  until: SourceCodeLocation
): void => {
  if (!(isRootDocumentLocation(from) && isRootDocumentLocation(until))) {
    return;
  }
  if (from.start.line !== until.start.line) {
    return;
  }
  const length = until.start.column - from.start.column;
  if (length <= 0) {
    return;
  }
  out.push({
    line: from.start.line - 1,
    startChar: from.start.column - 1,
    length,
    type: "keyword",
    modifiers: [],
  });
};

/** Highlight the element's leading keyword token. */
export const emitElementKeyword = (
  out: SemanticToken[],
  location: SourceCodeLocation
): void => {
  emitLocation(out, location, "keyword");
};
