import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
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
import { parseIndexSuffix } from "../../../parameters/explicit";
import { requireKeyword, requireParamCount } from "../helpers";

const resolveRequisitionPaletteIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.RequisitionPalette) {
      const palettes = ctx.symbolTable
        .toArray()
        .filter(
          (
            entry,
          ): entry is Extract<
            typeof entry,
            { kind: SymbolKind.RequisitionPalette }
          > => entry.kind === SymbolKind.RequisitionPalette,
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
    node.location,
  );
};

export const lowerPlayerSetRequisitionPalette = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.PlayerSetRequisitionPalette,
    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      requisitionPaletteIndex: resolveRequisitionPaletteIndex(
        parameters[1]!,
        ctx,
        location,
      ),
    },
  };
};
