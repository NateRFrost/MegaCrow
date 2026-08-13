import { BUILT_IN_LOCATION } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SymbolKind, type SymbolTableEntry } from "src/frontend/symbol-table";
import { LowerError } from "src/frontend/intermediate-representation/error";

const symbolKindName = (kind: SymbolKind): string => {
  const name = SymbolKind[kind];
  return typeof name === "string" ? name : String(kind);
};

export function assertSymbolKind<K extends SymbolKind>(
  symbol: SymbolTableEntry | undefined,
  kind: K
): asserts symbol is Extract<SymbolTableEntry, { kind: K }> {
  if (symbol === undefined) {
    throw new LowerError("Symbol not found", BUILT_IN_LOCATION);
  }
  if (symbol.kind !== kind) {
    throw new LowerError(
      diagnosticMessages.expectedOneOf(
        [`'${symbolKindName(kind)}'`],
        symbolKindName(symbol.kind)
      ),
      symbol.range
    );
  }
}
