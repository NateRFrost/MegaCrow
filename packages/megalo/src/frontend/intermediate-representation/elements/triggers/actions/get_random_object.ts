import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
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
import { resolveObjectReference } from "../../../parameters";
import { requireParamCount } from "../helpers";

const resolveObjectFilterIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location ?? location,
    );
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== SymbolKind.ObjectFilter) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location,
    );
  }
  return symbol.index;
};

export const lowerGetRandomObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.GetRandomObject,
    parameters: {
      filterIndex: resolveObjectFilterIndex(parameters[0]!, ctx, location),
      ignoreObject: resolveObjectReference(parameters[1]!, paramCtx),
      objectOut: resolveObjectReference(parameters[2]!, paramCtx),
    },
  };
};
