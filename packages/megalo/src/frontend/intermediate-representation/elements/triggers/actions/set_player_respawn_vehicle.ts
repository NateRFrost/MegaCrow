import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  resolveObjectTypeReference,
  resolvePlayerReference,
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
  expected: string
): number => {
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location
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
      diagnosticMessages.expectedParameterType(expected, name),
      node.location
    );
  }
  return symbol.index;
};

const resolveRespawnVehicleObjectType = (
  node: ASTParameterNode,
  paramCtx: ReturnType<typeof asParameterLoweringContext>,
  _location: SourceCodeLocation
) => {
  if (node.kind === SyntaxKind.REFERENCE) {
    try {
      return resolveObjectTypeReference(node, paramCtx);
    } catch {
      // Fall through to keyword/object-list resolution.
    }
  }
  return resolveObjectListKeywordIndex(
    node,
    ObjectListType.Objects,
    paramCtx,
    ObjectListType.Objects
  );
};

export const lowerSetPlayerRespawnVehicle = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.SetPlayerRespawnVehicle,
    parameters: {
      objectType: resolveRespawnVehicleObjectType(
        parameters[0]!,
        paramCtx,
        location
      ),
      player: resolvePlayerReference(parameters[1]!, paramCtx),
    },
  };
};
