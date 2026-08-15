import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
  resolveObjectTypeReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveObjectListKeywordIndex = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? ctx.symbolTable.getSymbol(node.symbolId)?.name
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, ""),
      node.location ?? location
    );
  }

  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === name
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, name),
      node.location ?? location
    );
  }
  return symbol.index;
};

const resolveObjectTypeParameter = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    return resolveObjectTypeReference(node, asParameterLoweringContext(ctx));
  }
  return resolveObjectListKeywordIndex(
    node,
    ObjectListType.Objects,
    ctx,
    location
  );
};

export const lowerCreateTunnel = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 5) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(5, parameters.length),
      location
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.create_tunnel,
    parameters: {
      from: resolveObjectReference(parameters[0]!, paramCtx),
      to: resolveObjectReference(parameters[1]!, paramCtx),
      objectType: resolveObjectTypeParameter(parameters[2]!, ctx, location),
      radious: resolveCustomVariableReference(parameters[3]!, paramCtx),
      objectReferenceOut: resolveObjectReference(parameters[4]!, paramCtx),
    },
  };
};
