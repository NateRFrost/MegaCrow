import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  requireKeyword,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolvePlayerReference } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { parseIndexSuffix } from "src/frontend/intermediate-representation/parameters/explicit";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveRequisitionPaletteIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.RequisitionPalette) {
      const palettes = ctx.symbolTable
        .toArray()
        .filter(
          (
            entry
          ): entry is Extract<
            typeof entry,
            { kind: SymbolKind.RequisitionPalette }
          > => entry.kind === SymbolKind.RequisitionPalette
        );
      const index = palettes.findIndex((entry) => entry.id === symbol.id);
      if (index >= 0) {
        return index;
      }
    }
  }
  if (node.kind === SyntaxKind.INTEGER) {
    return node.value;
  }
  const name = requireKeyword(node, location);
  const indexed = parseIndexSuffix(name, "requisition_palette");
  if (indexed !== undefined) {
    return indexed;
  }
  const numeric = Number(name);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("requisition palette", name),
    node.location
  );
};

export const lowerPlayerSetRequisitionPalette = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.player_set_requisition_palette,
    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      requisitionPaletteIndex: resolveRequisitionPaletteIndex(
        parameters[1]!,
        ctx,
        location
      ),
    },
  };
};
