import type { SymbolTable } from "src/frontend/symbol-table";
import { SymbolKind, VariableScope } from "src/frontend/symbol-table";
import type { SupportedMegaloVersion } from "src/version";

let highlightVersion: SupportedMegaloVersion | undefined;
let highlightSymbolTable: SymbolTable | undefined;

/** Run `fn` with analysis snapshot context available to highlight helpers. */
export const runWithHighlightContext = <T>(
  version: SupportedMegaloVersion,
  symbolTable: SymbolTable,
  fn: () => T
): T => {
  const previousVersion = highlightVersion;
  const previousTable = highlightSymbolTable;
  highlightVersion = version;
  highlightSymbolTable = symbolTable;
  try {
    return fn();
  } finally {
    highlightVersion = previousVersion;
    highlightSymbolTable = previousTable;
  }
};

/** @deprecated Prefer {@link runWithHighlightContext}. */
export const runWithHighlightVersion = <T>(
  version: SupportedMegaloVersion,
  fn: () => T
): T => {
  const previous = highlightVersion;
  highlightVersion = version;
  try {
    return fn();
  } finally {
    highlightVersion = previous;
  }
};

export const getHighlightVersion = (): SupportedMegaloVersion | undefined =>
  highlightVersion;

export const getHighlightSymbolTable = (): SymbolTable | undefined =>
  highlightSymbolTable;

const BUILTIN_MEMBER_NAMES = new Set([
  "score",
  "money",
  "user_data",
  "team",
  "rating",
]);

const COMPILED_MEMBER_NAME = /^(?:number|timer|object|player|team|stat)_\d+$/;

/**
 * Whether a `.member` should get property highlighting. Unresolved / unknown
 * members stay uncolored (error DX covers them instead).
 */
export const shouldHighlightMemberName = (name: string): boolean => {
  if (name.length === 0) {
    return false;
  }
  if (BUILTIN_MEMBER_NAMES.has(name) || COMPILED_MEMBER_NAME.test(name)) {
    return true;
  }
  const table = highlightSymbolTable;
  if (table === undefined) {
    return false;
  }
  for (const entry of table.toArray()) {
    if (entry.kind !== SymbolKind.Variable) {
      continue;
    }
    if (entry.name !== name) {
      continue;
    }
    if (
      entry.scope === VariableScope.Object ||
      entry.scope === VariableScope.Player ||
      entry.scope === VariableScope.Team
    ) {
      return true;
    }
  }
  return false;
};
