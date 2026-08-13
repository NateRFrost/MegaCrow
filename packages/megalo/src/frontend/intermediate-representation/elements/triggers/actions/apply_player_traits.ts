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
import { resolvePlayerReference } from "../../../parameters";
import { requireParamCount } from "../helpers";

const resolveTraitIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("player trait", ""),
      node.location ?? location
    );
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== SymbolKind.PlayerTraits) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("player trait", ""),
      node.location
    );
  }
  return symbol.index;
};

export const lowerApplyPlayerTraits = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.ApplyPlayerTraits,
    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      traitIndex: resolveTraitIndex(parameters[1]!, ctx, location),
    },
  };
};
