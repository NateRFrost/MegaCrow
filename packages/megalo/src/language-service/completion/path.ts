import {
  forReplacingToken,
  type SuggestCtx,
} from "src/language-service/completion/helpers";
import type { CompletionItem } from "src/language-service/completion/types";
import {
  offsetToPosition,
  positionToOffset,
} from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

export type PathDirectiveKind = "include" | "localized_include" | "base";

export interface PathDirectoryEntry {
  directory: boolean;
  name: string;
}

export interface QuotedPathCompletionQuery {
  /** Relative directory to list (`""` = document directory). */
  directory: string;
  kind: PathDirectiveKind;
  /** Current path-segment prefix being typed. */
  namePrefix: string;
}

const PATH_DIRECTIVE_OPEN_RE = /^\s*(include|localized_include|base)\s+"/i;

/** Split `foo/bar/ba` → `{ directory: "foo/bar", namePrefix: "ba" }`. */
export const splitPathPrefix = (
  typedPath: string
): { directory: string; namePrefix: string } => {
  const normalized = typedPath.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash < 0) {
    return { directory: "", namePrefix: normalized };
  }
  return {
    directory: normalized.slice(0, lastSlash),
    namePrefix: normalized.slice(lastSlash + 1),
  };
};

const lineTextBefore = (snapshot: AnalysisSnapshot, offset: number): string => {
  const { line } = offsetToPosition(snapshot.lineStarts, offset);
  const start = snapshot.lineStarts[line] ?? 0;
  return snapshot.source.slice(start, offset);
};

/**
 * When the cursor is inside an `include` / `localized_include` / `base` quoted
 * path, return the directory to list and the current segment prefix.
 */
export const getQuotedPathCompletionQuery = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): QuotedPathCompletionQuery | null => {
  const offset = positionToOffset(
    snapshot.lineStarts,
    snapshot.source.length,
    position.line,
    position.character
  );
  const before = lineTextBefore(snapshot, offset);
  const match = PATH_DIRECTIVE_OPEN_RE.exec(before);
  if (!match?.[1]) {
    return null;
  }
  const afterOpen = before.slice(match[0].length);
  // Past the closing quote → no longer editing the path.
  if (afterOpen.includes('"')) {
    return null;
  }

  const kind = match[1].toLowerCase() as PathDirectiveKind;
  const { directory, namePrefix } = splitPathPrefix(afterOpen);
  return { kind, directory, namePrefix };
};

const suggestCtxFromQuery = (query: QuotedPathCompletionQuery): SuggestCtx =>
  ({
    kind: "none",
    offset: 0,
    prefix: {
      text: query.namePrefix,
      quoted: true,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    },
    snapshot: null as unknown as AnalysisSnapshot,
  }) as SuggestCtx;

/**
 * Build file/folder completion items for a quoted path directive.
 * `insertText` is only the current segment (Monaco replaces the word after `/`).
 */
export const completeQuotedPath = (
  query: QuotedPathCompletionQuery,
  entries: readonly PathDirectoryEntry[]
): CompletionItem[] => {
  const items: CompletionItem[] = [];
  for (const entry of entries) {
    if (!entry.name || entry.name === "." || entry.name === "..") {
      continue;
    }
    if (entry.name.startsWith(".")) {
      continue;
    }
    if (entry.directory) {
      items.push({
        label: `${entry.name}/`,
        kind: "folder",
        detail: "folder",
        insertText: `${entry.name}/`,
        sortText: `0_${entry.name}`,
      });
      continue;
    }
    items.push({
      label: entry.name,
      kind: "file",
      detail: "file",
      insertText: entry.name,
      sortText: `1_${entry.name}`,
    });
  }

  items.sort((a, b) =>
    (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label)
  );
  return forReplacingToken(suggestCtxFromQuery(query), items);
};
