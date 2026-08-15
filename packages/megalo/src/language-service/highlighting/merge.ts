import type { SemanticToken } from "src/language-service/highlighting/types";
import { TYPE_PRIORITY } from "src/language-service/highlighting/types";

const overlaps = (a: SemanticToken, b: SemanticToken): boolean => {
  if (a.line !== b.line) {
    return false;
  }
  const aEnd = a.startChar + a.length;
  const bEnd = b.startChar + b.length;
  return a.startChar < bEnd && b.startChar < aEnd;
};

export const mergeTokens = (tokens: SemanticToken[]): SemanticToken[] => {
  const sorted = [...tokens].sort((a, b) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    if (a.startChar !== b.startChar) {
      return a.startChar - b.startChar;
    }
    return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
  });

  const result: SemanticToken[] = [];
  for (const token of sorted) {
    if (token.length <= 0) {
      continue;
    }
    const last = result.at(-1);
    if (last !== undefined && overlaps(last, token)) {
      if (TYPE_PRIORITY[token.type] > TYPE_PRIORITY[last.type]) {
        result[result.length - 1] = token;
      }
      continue;
    }
    result.push(token);
  }
  return result;
};

export const clipTokensToSource = (
  source: string,
  tokens: SemanticToken[]
): SemanticToken[] => {
  const lines = source.split(/\r?\n/);
  return tokens
    .map((token) => {
      const lineText = lines[token.line];
      if (lineText === undefined) {
        return undefined;
      }
      const maxLen = Math.max(0, lineText.length - token.startChar);
      const length = Math.min(token.length, maxLen);
      if (length <= 0 || token.startChar < 0) {
        return undefined;
      }
      return { ...token, length };
    })
    .filter((token): token is SemanticToken => token !== undefined);
};
