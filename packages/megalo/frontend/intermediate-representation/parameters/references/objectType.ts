import { SyntaxKind } from "../../../abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ObjectListType } from "../../../object-lists";
import { SymbolKind } from "../../../symbol-table";
import { LowerError } from "../../error";
import type { ObjectTypeReference } from "../../game/megalogamengine/megalogamengine_references";
import type { ParameterLoweringContext } from "../context";

export const resolveObjectTypeReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  acceptedObjectTypes?: readonly ObjectListType[]
): ObjectTypeReference => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      `Expected object type reference, got ${node.kind}`,
      node.location
    );
  }

  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol === undefined || symbol.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      `Expected object list item reference`,
      node.location
    );
  }

  const allowed =
    acceptedObjectTypes !== undefined && acceptedObjectTypes.length > 0
      ? acceptedObjectTypes
      : [ObjectListType.Objects];

  if (!allowed.includes(symbol.objectType)) {
    throw new LowerError(
      `Object list type ${symbol.objectType} is not accepted`,
      node.location
    );
  }

  return symbol.index;
};
