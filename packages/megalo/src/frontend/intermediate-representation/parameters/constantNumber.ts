import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { NumericInitialValue } from "src/frontend/abstract-syntax-tree/elements/constants";
import { SymbolKind } from "src/frontend/symbol-table";
import { type Located, located } from "src/frontend/intermediate-representation";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { assertSymbolKind } from "src/frontend/intermediate-representation/diagnostics/assertSymbolKind";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

/**
 * Lower a constant/literal number only (option defaults, overrides, engine icon).
 * Does not accept user-declared variables.
 */
export const lowerConstantNumber = (
  node: NumericInitialValue,
  ctx: Pick<ElementLowerContext, "symbolTable">
): Located<number> => {
  assertSyntaxKind(node, [
    SyntaxKind.INTEGER,
    SyntaxKind.FLOATING_POINT,
    SyntaxKind.REFERENCE,
  ]);
  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return located(node.value, node.location);
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  assertSymbolKind(symbol, SymbolKind.Constant);
  return located(symbol.value, node.location);
};
