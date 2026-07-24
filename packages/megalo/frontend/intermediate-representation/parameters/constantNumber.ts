import { SyntaxKind } from "../../abstract-syntax-tree";
import type { NumericInitialValue } from "../../abstract-syntax-tree/elements/constants";
import { SymbolKind } from "../../symbol-table";
import { type ValueWithLocation, valueWithLocation } from "..";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { assertSymbolKind } from "../diagnostics/assertSymbolKind";
import type { ElementLowerContext } from "./context";

/**
 * Lower a constant/literal number only (option defaults, overrides, engine icon).
 * Does not accept user-declared variables.
 */
export const lowerConstantNumber = (
  node: NumericInitialValue,
  ctx: Pick<ElementLowerContext, "symbolTable">
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
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  assertSymbolKind(symbol, SymbolKind.Constant);
  return valueWithLocation(symbol.value, node.location);
};
