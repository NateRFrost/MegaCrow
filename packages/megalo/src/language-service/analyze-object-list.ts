import { getConfigurationForVersion } from "src/backend/version-configuration";
import {
  type Diagnostic,
  Diagnostics,
  type SourceCodeLocation,
  SourceLocationType,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { computeLineStarts } from "src/language-service/position";
import type { SupportedMegaloVersion } from "src/version";

export interface AnalyzeObjectListOptions {
  version: SupportedMegaloVersion;
}

/**
 * Entry slots in an object-list `.txt` (one per line; blank lines count).
 * A trailing newline alone does not add an extra slot.
 */
export const objectListEntryCount = (source: string): number => {
  if (source.length === 0) {
    return 0;
  }
  const lines = source.split("\n");
  if (lines.length > 0 && lines.at(-1) === "") {
    return lines.length - 1;
  }
  return lines.length;
};

const sourceSpanLocation = (
  source: string,
  startLine0: number,
  endLine0Inclusive: number
): SourceCodeLocation => {
  const lineStarts = computeLineStarts(source);
  const startOffset = lineStarts[startLine0] ?? 0;
  const endLineStart = lineStarts[endLine0Inclusive] ?? source.length;
  const nextLineStart = lineStarts[endLine0Inclusive + 1];
  const endOffset =
    nextLineStart === undefined
      ? source.length
      : // Exclude the newline that ends the last excess line when present.
        Math.max(endLineStart, nextLineStart - 1);
  const endColumn = endOffset > endLineStart ? endOffset - endLineStart + 1 : 1;

  return {
    type: SourceLocationType.SOURCE_CODE,
    start: {
      localOffset: startOffset,
      absoluteOffset: startOffset,
      line: startLine0 + 1,
      column: 1,
    },
    end: {
      localOffset: endOffset,
      absoluteOffset: endOffset,
      line: endLine0Inclusive + 1,
      column: endColumn,
    },
  };
};

/**
 * Validate an object-list source file against the version's `objectsUsed`
 * limit and reject duplicate names (MegaloEdit hard-fails on duplicates).
 * Excess entries produce a diagnostic spanning the extra contents.
 */
export const analyzeObjectListSource = (
  source: string,
  options: AnalyzeObjectListOptions
): Diagnostic[] => {
  const diagnostics = new Diagnostics();
  const { limits } = getConfigurationForVersion(options.version);
  const max = limits.objectsUsed;
  const count = objectListEntryCount(source);

  const lines = source.length === 0 ? [] : source.split("\n");
  if (lines.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }

  const firstLineByName = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").replace(/\r$/, "");
    if (line.trim() === "") {
      continue;
    }
    const previousLine0 = firstLineByName.get(line);
    if (previousLine0 !== undefined) {
      diagnostics.addError(
        diagnosticMessages.objectListDuplicateEntry(
          line,
          previousLine0 + 1,
          i + 1
        ),
        sourceSpanLocation(source, i, i)
      );
      continue;
    }
    firstLineByName.set(line, i);
  }

  if (count > max) {
    const startLine0 = max;
    const endLine0 = count - 1;
    diagnostics.addError(
      diagnosticMessages.objectListExceedsObjectsLimit(count, max),
      sourceSpanLocation(source, startLine0, endLine0)
    );
  }

  return [...diagnostics.getErrors(), ...diagnostics.getWarnings()];
};
