import { SyntaxKind } from "../../../abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import type { SourceLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { SymbolKind } from "../../../symbol-table";
import { LowerError } from "../../error";
import type { ObjectTypeReference } from "../../game/megalogamengine/megalogamengine_references";
import type { ParameterLoweringContext } from "../context";

const objectTypeName = (node: ASTParameterNode): string | undefined => {
  switch (node.kind) {
    case SyntaxKind.REFERENCE:
      return node.identifier;
    case SyntaxKind.KEYWORD:
      return node.value;
    case SyntaxKind.QUOTED_STRING:
      return node.value;
    default:
      return undefined;
  }
};

const markObjectTypeUsed = (
  index: number,
  ctx: ParameterLoweringContext,
  location: SourceLocation
): void => {
  const max = ctx.frontend.versionConfiguration.limits.objectsUsed;
  if (index >= max) {
    throw new LowerError(
      diagnosticMessages.objectTypeIndexOutOfRange(index, max),
      location
    );
  }
  ctx.ir.gameVariant.gameEngine.objectsUsed[index] = true;
};

export const resolveObjectTypeReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  acceptedObjectTypes?: readonly ObjectListType[]
): ObjectTypeReference => {
  const allowed =
    acceptedObjectTypes !== undefined && acceptedObjectTypes.length > 0
      ? acceptedObjectTypes
      : [ObjectListType.Objects];

  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol !== undefined && symbol.kind === SymbolKind.ObjectListItem) {
      if (!allowed.includes(symbol.objectType)) {
        throw new LowerError(
          `Object list type ${symbol.objectType} is not accepted`,
          node.location
        );
      }
      // Update m_objects_used to mark this object type as used.
      if (symbol.objectType === ObjectListType.Objects && symbol.index >= 0) {
        markObjectTypeUsed(symbol.index, ctx, node.location);
      }
      return symbol.index;
    }
  }

  const name = objectTypeName(node);
  if (name === undefined) {
    throw new LowerError(
      `Expected object type reference, got ${node.kind}`,
      node.location
    );
  }

  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        allowed.includes(entry.objectType) &&
        entry.name === name
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        allowed.length === 1 ? allowed[0]! : "object type",
        name
      ),
      node.location
    );
  }
  if (symbol.objectType === ObjectListType.Objects && symbol.index >= 0) {
    markObjectTypeUsed(symbol.index, ctx, node.location);
  }
  return symbol.index;
};
