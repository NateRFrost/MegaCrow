import { SyntaxKind } from "../../abstract-syntax-tree";
import type { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { SymbolKind } from "../../symbol-table";
import { type Located, located } from "..";
import { LowerError } from "../error";
import type { ParameterLoweringContext } from "./context";

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
