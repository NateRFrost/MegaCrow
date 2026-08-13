import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SymbolKind } from "src/frontend/symbol-table";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolvePlayerReference } from "src/frontend/intermediate-representation/parameters";
import { requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

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
