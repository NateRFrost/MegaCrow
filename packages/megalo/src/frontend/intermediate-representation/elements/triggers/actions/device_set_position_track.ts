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
  resolveCustomVariableReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveDeviceAnimationNameIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  // MegaloEdit ReadStringIdName: identifier or quoted string from strings.txt.
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.QUOTED_STRING
        ? node.value
        : node.kind === SyntaxKind.REFERENCE
          ? (ctx.symbolTable.getSymbol(node.symbolId)?.name ?? node.identifier)
          : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("device animation", ""),
      node.location ?? location
    );
  }

  const listItem = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === ObjectListType.Strings &&
        entry.name === name
    );
  if (listItem?.kind === SymbolKind.ObjectListItem) {
    return listItem.index + 1;
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType("device animation", name),
    node.location ?? location
  );
};

export const lowerDeviceSetPositionTrack = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.DeviceSetPositionTrack,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      animationNameIndex: resolveDeviceAnimationNameIndex(
        parameters[1]!,
        ctx,
        location
      ),
      interpolationTime: resolveCustomVariableReference(
        parameters[2]!,
        paramCtx
      ),
    },
  };
};
