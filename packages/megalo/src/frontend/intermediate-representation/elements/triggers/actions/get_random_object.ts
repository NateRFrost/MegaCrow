import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritableObject } from "src/frontend/intermediate-representation/diagnostics";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveObjectFilterIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location ?? location
    );
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== SymbolKind.ObjectFilter) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location
    );
  }
  return symbol.index;
};

export const lowerGetRandomObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const __writableOut = resolveObjectReference(parameters[2]!, paramCtx);
  assertWritableObject(__writableOut, parameters[2]!.location);
  return {
    type: ActionType.get_random_object,
    parameters: {
      filterIndex: resolveObjectFilterIndex(parameters[0]!, ctx, location),
      ignoreObject: resolveObjectReference(parameters[1]!, paramCtx),
      objectOut: __writableOut,
    },
  };
};
