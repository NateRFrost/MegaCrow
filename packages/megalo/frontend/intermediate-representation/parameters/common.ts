import { SyntaxKind } from "../../abstract-syntax-tree";
import type { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { SymbolKind } from "../../symbol-table";
import { type Located, located } from "..";
import { LowerError } from "../error";
import type { ParameterLoweringContext } from "./context";

/**
 * Lower a flat parameter list as a number (literal or named constant).
 */
export const lowerNumberParam = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  expected: string,
  location: SourceCodeLocation
): Located<number> => {
  const node = parameters[0];
  if (node === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      location
    );
  }

  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return located(node.value, node.location);
  }

  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.Constant) {
      return located(symbol.value, node.location);
    }
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType(expected, ""),
    node.location
  );
};

/**
 * Lower a boolean from a number parameter (0 = false, non-zero = true).
 */
export const lowerBooleanParam = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  location: SourceCodeLocation
): Located<boolean> => {
  const value = lowerNumberParam(parameters, ctx, "boolean", location);
  return located(value.value !== 0, value.location);
};
