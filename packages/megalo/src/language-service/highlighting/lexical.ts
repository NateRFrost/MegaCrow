import { TokenKind } from "src/frontend/tokens";
import { emitLocation } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";
import { isRootDocumentLocation } from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

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
        emitLocation(out, token.location, "string");
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
