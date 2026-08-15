import type { SourceCodeLocation } from "src/diagnostics";
import { TokenKind } from "src/frontend/tokens";
import { emitLocation } from "src/language-service/highlighting/emit";
import type {
  SemanticToken,
  SemanticTokenType,
} from "src/language-service/highlighting/types";
import { isRootDocumentLocation } from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

/** Dynamic-string placeholders (`%n`, `%p`, `%t`, `%o`, `%s`). */
const FORMAT_PLACEHOLDER_CHARS = new Set(["n", "p", "t", "o", "s"]);

const emitRelativeSpan = (
  out: SemanticToken[],
  location: SourceCodeLocation,
  relativeStart: number,
  length: number,
  type: SemanticTokenType
): void => {
  if (length <= 0 || location.start.line !== location.end.line) {
    return;
  }
  out.push({
    line: location.start.line - 1,
    startChar: location.start.column - 1 + relativeStart,
    length,
    type,
    modifiers: [],
  });
};

/**
 * Emit non-overlapping string / escape / format spans for a quoted string.
 * (Merge would otherwise drop the whole-string token when an escape overlaps it.)
 */
const highlightQuotedString = (
  out: SemanticToken[],
  location: SourceCodeLocation,
  source: string
): void => {
  const text = source.slice(
    location.start.localOffset,
    location.end.localOffset
  );
  if (text.length === 0) {
    return;
  }

  let cursor = 0;
  const flushString = (until: number) => {
    if (until > cursor) {
      emitRelativeSpan(out, location, cursor, until - cursor, "string");
      cursor = until;
    }
  };

  // Walk content; keep quote characters as ordinary string spans.
  for (let i = 1; i < text.length - 1; i++) {
    const ch = text[i]!;
    if (ch === "\\" && i + 1 < text.length) {
      flushString(i);
      emitRelativeSpan(out, location, i, 2, "regexp");
      cursor = i + 2;
      i += 1;
      continue;
    }
    if (ch === "%") {
      const next = text[i + 1];
      if (next !== undefined && FORMAT_PLACEHOLDER_CHARS.has(next)) {
        flushString(i);
        emitRelativeSpan(out, location, i, 2, "regexp");
        cursor = i + 2;
        i += 1;
      }
    }
  }
  flushString(text.length);
};

/** Lexical token highlighting (comments, strings, numbers, operators, `end`). */
export const highlightLexicalTokens = (
  out: SemanticToken[],
  snapshot: AnalysisSnapshot
): void => {
  for (const token of snapshot.tokens) {
    if (!isRootDocumentLocation(token.location)) {
      continue;
    }
    switch (token.kind) {
      case TokenKind.Comment:
        emitLocation(out, token.location, "comment");
        break;
      case TokenKind.QuotedString:
        highlightQuotedString(out, token.location, snapshot.source);
        break;
      case TokenKind.Integer:
      case TokenKind.FloatingPoint:
        emitLocation(out, token.location, "number");
        break;
      case TokenKind.Operator:
      case TokenKind.MemberVariableSeparator:
        emitLocation(out, token.location, "operator");
        break;
      case TokenKind.Identifier:
        if (token.value === "end") {
          emitLocation(out, token.location, "keyword");
        }
        break;
      default:
        break;
    }
  }
};
