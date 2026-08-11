import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../../object-lists";
import { SymbolKind } from "../../../../symbol-table";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveObjectTypeReference,
  resolvePlayerReference,
} from "../../../parameters";
import { requireParamCount } from "../helpers";

const resolveObjectListKeywordIndex = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext,
  expected: string,
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
      node.location,
    );
  }
  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === name,
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, name),
      node.location,
    );
  }
  return symbol.index;
};

const resolveRespawnVehicleObjectType = (
  node: ASTParameterNode,
  paramCtx: ReturnType<typeof asParameterLoweringContext>,
  location: SourceCodeLocation,
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
    ObjectListType.Objects,
  );
};

export const lowerSetPlayerRespawnVehicle = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.SetPlayerRespawnVehicle,
    parameters: {
      objectType: resolveRespawnVehicleObjectType(
        parameters[0]!,
        paramCtx,
        location,
      ),
      player: resolvePlayerReference(parameters[1]!, paramCtx),
    },
  };
};
