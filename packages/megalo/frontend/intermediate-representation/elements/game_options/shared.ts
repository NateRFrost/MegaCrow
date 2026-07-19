import { SyntaxKind } from "../../../abstract-syntax-tree";
import type { NumericInitialValue } from "../../../abstract-syntax-tree/elements/constants";
import { SymbolKind, type SymbolTable } from "../../../symbol-table";
import { type ValueWithLocation, valueWithLocation } from "../..";
import { assertSyntaxKind } from "../../diagnostics/assertSyntaxKind";
import { assertSymbolKind } from "../../diagnostics/assertSymbolKind";
import type { PlayerTraits } from "../../game/game_engine_player_traits";

export const emptyPlayerTraits = (): PlayerTraits => ({
  shieldVitality: {},
  weapons: {},
  movement: {},
  appearance: {},
  sensors: {},
});

export const unwrapNumber = (value: ValueWithLocation<number>): number =>
  Number(value);

export const resolveNumericValue = (
  node: NumericInitialValue,
  symbolTable: SymbolTable
): ValueWithLocation<number> => {
  assertSyntaxKind(node, [
    SyntaxKind.INTEGER,
    SyntaxKind.FLOATING_POINT,
    SyntaxKind.REFERENCE,
  ]);
  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return valueWithLocation(node.value, node.location);
  }
  const symbol = symbolTable.getSymbol(node.symbolId);
  assertSymbolKind(symbol, SymbolKind.Constant);
  return valueWithLocation(symbol.value, node.location);
};
