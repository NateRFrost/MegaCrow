import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SymbolKind } from "src/frontend/symbol-table";
import { type Located, located } from "src/frontend/intermediate-representation";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";

/**
 * MegaloEdit `ReadConstantInteger` / `ParseConstantInteger`:
 */
export const tryLowerConstantInteger = (
  node: ASTParameterNode,
  ctx: Pick<ParameterLoweringContext, "symbolTable">
): Located<number> | undefined => {
  if (node.kind === SyntaxKind.INTEGER) {
    return located(node.value, node.location);
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.Constant) {
      return located(symbol.value, node.location);
    }
  }
  return undefined;
};

export const lowerConstantInteger = (
  node: ASTParameterNode,
  ctx: Pick<ParameterLoweringContext, "symbolTable">,
  expected: string,
  location: SourceCodeLocation
): Located<number> => {
  const value = tryLowerConstantInteger(node, ctx);
  if (value !== undefined) {
    return value;
  }
  const got =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : node.kind === SyntaxKind.FLOATING_POINT
          ? String(node.value)
          : "";
  throw new LowerError(
    diagnosticMessages.expectedParameterType(expected, got),
    node.location ?? location
  );
};

/**
 * MegaloEdit ReadConstantReal: float or int literal, or named number constant.
 */
export const lowerFloatParam = (
  node: ASTParameterNode,
  ctx: Pick<ParameterLoweringContext, "symbolTable">,
  expected: string,
  location: SourceCodeLocation
): Located<number> => {
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
    node.location ?? location
  );
};

export const lowerBooleanParam = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  location: SourceCodeLocation
): Located<boolean> => {
  const node = parameters[0];
  if (node === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("boolean", ""),
      location
    );
  }
  const value = lowerConstantInteger(node, ctx, "boolean", location);
  return located(value.value !== 0, value.location);
};
