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
import { parseBooleanLiteral } from "../helpers";

const resolveDeclaredSymbolIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  kind: SymbolKind.HudWidget | SymbolKind.LoadoutPalette,
  expected: string,
  location: SourceCodeLocation,
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location ?? location,
    );
  }

  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== kind) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location,
    );
  }

  const entries = ctx.symbolTable
    .toArray()
    .filter((entry) => entry.kind === kind);
  const index = entries.findIndex((entry) => entry.id === symbol.id);
  if (index < 0) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, symbol.name),
      node.location,
    );
  }
  return index;
};

const resolveHudWidgetIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number =>
  resolveDeclaredSymbolIndex(
    node,
    ctx,
    SymbolKind.HudWidget,
    "HUD widget",
    location,
  );

export const lowerHudWidgetSetVisibility = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length !== 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location,
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  return {
    type: ActionType.HudWidgetSetVisibility,
    parameters: {
      widgetIndex: resolveHudWidgetIndex(parameters[0]!, ctx, location),
      player: resolvePlayerReference(parameters[1]!, paramCtx),
      visible: parseBooleanLiteral(parameters[2]!, ctx, location),
    },
  };
};
