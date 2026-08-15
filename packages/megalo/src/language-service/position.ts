import type { SourceCodeLocation, SourcePosition } from "src/diagnostics";
import { SourceLocationType } from "src/diagnostics";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

/** 0-based line starts (byte/UTF-16 offsets into source). */
export const computeLineStarts = (source: string): number[] => {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10 /* \n */) {
      starts.push(i + 1);
    }
  }
  return starts;
};

/** Convert a 0-based localOffset into 0-based line + UTF-16 character. */
export const offsetToPosition = (
  lineStarts: readonly number[],
  offset: number
): { line: number; character: number } => {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid]! <= offset) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return { line: lo, character: Math.max(0, offset - lineStarts[lo]!) };
};

/** Convert 0-based line + character to localOffset (clamped). */
export const positionToOffset = (
  lineStarts: readonly number[],
  sourceLength: number,
  line: number,
  character: number
): number => {
  if (line < 0) {
    return 0;
  }
  if (line >= lineStarts.length) {
    return sourceLength;
  }
  const start = lineStarts[line]!;
  const next = lineStarts[line + 1] ?? sourceLength;
  return Math.min(next, start + Math.max(0, character));
};

export const isRootDocumentLocation = (location: SourceCodeLocation): boolean =>
  location.type === SourceLocationType.SOURCE_CODE &&
  location.include === undefined &&
  location.start.line > 0 &&
  location.start.absoluteOffset === location.start.localOffset;

/** Exclusive end column length on a single line (0 if multi-line). */
export const singleLineSpanLength = (location: SourceCodeLocation): number =>
  location.start.line === location.end.line
    ? Math.max(0, location.end.column - location.start.column)
    : 0;

export const locationContainsOffset = (
  location: SourceCodeLocation,
  localOffset: number
): boolean =>
  localOffset >= location.start.localOffset &&
  localOffset < location.end.localOffset;

export const positionAtOffset = (
  snapshot: AnalysisSnapshot,
  localOffset: number
): SourcePosition => {
  const { line, character } = offsetToPosition(
    snapshot.lineStarts,
    localOffset
  );
  return {
    line: line + 1,
    column: character + 1,
    localOffset,
    absoluteOffset: localOffset,
  };
};
