import { BUILT_IN_LOCATION } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { SymbolKind, type SymbolTableEntry } from "../../symbol-table";
import { LowerError } from "../error";

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
