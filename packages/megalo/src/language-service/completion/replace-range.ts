import type { SourceCodeLocation } from "src/diagnostics";
import type {
  CompletionPrefix,
  CompletionRange,
} from "src/language-service/completion/types";
import {
  offsetToPosition,
  positionToOffset,
} from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

const isIdentContinue = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

const isIdentStart = (ch: string): boolean => /[A-Za-z_]/.test(ch);

const toRange = (
  lineStarts: readonly number[],
  startOffset: number,
  endOffset: number
): CompletionRange => {
  const start = offsetToPosition(lineStarts, startOffset);
  const end = offsetToPosition(lineStarts, endOffset);
  return { start, end };
};

/**
 * Find the identifier or quoted-string prefix ending at `offset` (exclusive end
 * of the typed text — typically the cursor).
 */
export const findCompletionPrefix = (
  snapshot: AnalysisSnapshot,
  offset: number
): CompletionPrefix => {
  const { source, lineStarts } = snapshot;
  const clamped = Math.max(0, Math.min(offset, source.length));

  // Walk this line from the start so a closing `"` is not mistaken for an opener
  // (e.g. cursor after `create_object "banshee" `).
  let lineStart = clamped;
  while (lineStart > 0 && source[lineStart - 1] !== "\n") {
    lineStart -= 1;
  }
  let inString = false;
  let stringStart = -1;
  for (let i = lineStart; i < clamped; i++) {
    const ch = source[i]!;
    if (!inString) {
      if (ch === '"') {
        inString = true;
        stringStart = i;
      }
      continue;
    }
    if (ch === "\\" && i + 1 < clamped) {
      i += 1;
      continue;
    }
    if (ch === '"') {
      inString = false;
      stringStart = -1;
    }
  }
  if (inString && stringStart >= 0) {
    const text = source.slice(stringStart + 1, clamped);
    return {
      text,
      quoted: true,
      range: toRange(lineStarts, stringStart, clamped),
    };
  }

  // Bare identifier (or member name after `.`).
  let start = clamped;
  while (start > 0 && isIdentContinue(source[start - 1]!)) {
    start -= 1;
  }
  if (start < clamped && !isIdentStart(source[start]!)) {
    // Digits-only or invalid — treat as empty prefix at cursor.
    return {
      text: "",
      quoted: false,
      range: toRange(lineStarts, clamped, clamped),
    };
  }

  const text = source.slice(start, clamped);
  const range = toRange(lineStarts, start, clamped);

  // `root.<member>` — attribute the typed span to the member, remember the root.
  if (start > 0 && source[start - 1] === ".") {
    const rootEnd = start - 1;
    let rootStart = rootEnd;
    while (rootStart > 0 && isIdentContinue(source[rootStart - 1]!)) {
      rootStart -= 1;
    }
    if (
      rootStart < rootEnd &&
      isIdentStart(source[rootStart]!) &&
      // No nested `a.b.` yet — only one level of member completion.
      (rootStart === 0 || source[rootStart - 1] !== ".")
    ) {
      return {
        text,
        quoted: false,
        range,
        memberOf: source.slice(rootStart, rootEnd),
      };
    }
  }

  return {
    text,
    quoted: false,
    range,
  };
};

export const emptyPrefixAt = (
  snapshot: AnalysisSnapshot,
  line: number,
  character: number
): CompletionPrefix => {
  const offset = positionToOffset(
    snapshot.lineStarts,
    snapshot.source.length,
    line,
    character
  );
  return findCompletionPrefix(snapshot, offset);
};

export const locationToCompletionRange = (
  location: SourceCodeLocation
): CompletionRange => ({
  start: {
    line: Math.max(0, location.start.line - 1),
    character: Math.max(0, location.start.column - 1),
  },
  end: {
    line: Math.max(0, location.end.line - 1),
    character: Math.max(0, location.end.column - 1),
  },
});
