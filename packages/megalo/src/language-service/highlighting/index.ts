import { highlightElement } from "src/language-service/highlighting/elements";
import { highlightLexicalTokens } from "src/language-service/highlighting/lexical";
import {
  clipTokensToSource,
  mergeTokens,
} from "src/language-service/highlighting/merge";
import { runWithHighlightVersion } from "src/language-service/highlighting/session";
import { highlightSymbol } from "src/language-service/highlighting/symbols";
import {
  MODIFIER_INDEX,
  type SemanticToken,
  TYPE_INDEX,
} from "src/language-service/highlighting/types";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

export {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticToken,
  type SemanticTokenModifier,
  type SemanticTokenType,
} from "src/language-service/highlighting/types";

/**
 * Classify semantic tokens from a shared analysis snapshot.
 * Lexical tokens + symbol table + per-element AST walk.
 */
export const getSemanticTokens = (
  snapshot: AnalysisSnapshot
): SemanticToken[] =>
  runWithHighlightVersion(snapshot.version, () => {
    const out: SemanticToken[] = [];

    highlightLexicalTokens(out, snapshot);

    for (const entry of snapshot.ast.symbolTable.toArray()) {
      highlightSymbol(out, entry);
    }

    for (const element of snapshot.ast.elements) {
      highlightElement(out, element);
    }

    return clipTokensToSource(snapshot.source, mergeTokens(out));
  });

/** Encode tokens as an LSP/Monaco semantic-tokens delta stream. */
export const encodeSemanticTokens = (tokens: SemanticToken[]): number[] => {
  const data: number[] = [];
  let prevLine = 0;
  let prevChar = 0;

  for (const token of tokens) {
    const deltaLine = token.line - prevLine;
    const deltaStart =
      deltaLine === 0 ? token.startChar - prevChar : token.startChar;
    let modifierBits = 0;
    for (const modifier of token.modifiers) {
      modifierBits |= 1 << MODIFIER_INDEX[modifier];
    }
    data.push(
      deltaLine,
      deltaStart,
      token.length,
      TYPE_INDEX[token.type],
      modifierBits
    );
    prevLine = token.line;
    prevChar = token.startChar;
  }

  return data;
};
