import type { SourceCodeLocation, SourceLocation } from "src/diagnostics";
import {
  isIncludeLocation,
  isSourceCodeLocation,
  SourceLocationType,
} from "src/diagnostics";
import { SymbolKind, type SymbolTableEntry } from "src/frontend/symbol-table";
import {
  isRootDocumentLocation,
  locationContainsOffset,
  positionToOffset,
} from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

/** 0-based LSP-style range. */
export interface DefinitionRange {
  end: { character: number; line: number };
  start: { character: number; line: number };
}

/**
 * Where to jump for go-to-definition.
 * `current` = same open document; `file` = an include (or other) source path.
 */
export type DefinitionTarget =
  | { kind: "current"; range: DefinitionRange }
  | { kind: "file"; file: string; range: DefinitionRange };

const sourceCodeToRange = (location: SourceCodeLocation): DefinitionRange => ({
  start: {
    line: Math.max(0, location.start.line - 1),
    character: Math.max(0, location.start.column - 1),
  },
  end: {
    line: Math.max(0, location.end.line - 1),
    character: Math.max(0, location.end.column - 1),
  },
});

const spanLength = (location: SourceCodeLocation): number =>
  Math.max(0, location.end.localOffset - location.start.localOffset);

/** Declarations we can navigate to (not built-ins / object-list enums). */
const navigableDeclaration = (
  declaration: SourceLocation
): DefinitionTarget | null => {
  if (isIncludeLocation(declaration)) {
    return {
      kind: "file",
      file: declaration.file,
      range: sourceCodeToRange(declaration.source),
    };
  }
  if (!isSourceCodeLocation(declaration)) {
    return null;
  }
  if (declaration.include) {
    return {
      kind: "file",
      file: declaration.include.file,
      range: sourceCodeToRange({
        type: SourceLocationType.SOURCE_CODE,
        start: declaration.start,
        end: declaration.end,
      }),
    };
  }
  return { kind: "current", range: sourceCodeToRange(declaration) };
};

const entryDeclarations = (entry: SymbolTableEntry): SourceLocation[] => {
  if (entry.kind === SymbolKind.String) {
    return Object.values(entry.languageDeclarations).filter(
      (location): location is SourceLocation => location !== undefined
    );
  }
  return [entry.declaration];
};

const rootHitLocations = (entry: SymbolTableEntry): SourceCodeLocation[] => {
  const hits: SourceCodeLocation[] = [];
  for (const reference of entry.references) {
    if (isRootDocumentLocation(reference)) {
      hits.push(reference);
    }
  }
  for (const declaration of entryDeclarations(entry)) {
    if (
      isSourceCodeLocation(declaration) &&
      isRootDocumentLocation(declaration)
    ) {
      hits.push(declaration);
    }
  }
  return hits;
};

/**
 * Resolve go-to-definition for a 0-based position in the snapshot's root document.
 * Returns null for built-ins, object-list enums, and unknown symbols.
 */
export const definitionAtPosition = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): DefinitionTarget | null => {
  const offset = positionToOffset(
    snapshot.lineStarts,
    snapshot.source.length,
    position.line,
    position.character
  );

  let best: { entry: SymbolTableEntry; length: number } | null = null;

  for (const entry of snapshot.ast.symbolTable.toArray()) {
    for (const hit of rootHitLocations(entry)) {
      if (!locationContainsOffset(hit, offset)) {
        continue;
      }
      const length = spanLength(hit);
      if (best === null || length < best.length) {
        best = { entry, length };
      }
    }
  }

  if (!best) {
    return null;
  }

  for (const declaration of entryDeclarations(best.entry)) {
    const target = navigableDeclaration(declaration);
    if (target) {
      return target;
    }
  }
  return null;
};
