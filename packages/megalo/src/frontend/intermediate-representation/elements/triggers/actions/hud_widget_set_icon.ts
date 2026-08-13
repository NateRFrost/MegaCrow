import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveDeclaredSymbolIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  kind: SymbolKind.HudWidget | SymbolKind.LoadoutPalette,
  expected: string,
  location: SourceCodeLocation
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location ?? location
    );
  }

  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== kind) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location
    );
  }

  const entries = ctx.symbolTable
    .toArray()
    .filter((entry) => entry.kind === kind);
  const index = entries.findIndex((entry) => entry.id === symbol.id);
  if (index < 0) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, symbol.name),
      node.location
    );
  }
  return index;
};

const resolveHudWidgetIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number =>
  resolveDeclaredSymbolIndex(
    node,
    ctx,
    SymbolKind.HudWidget,
    "HUD widget",
    location
  );

const resolveHudWidgetIconIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind === SyntaxKind.KEYWORD && node.value === "none") {
    return -1;
  }

  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (
      symbol?.kind === SymbolKind.ObjectListItem &&
      symbol.objectType === ObjectListType.HudWidgetIcons
    ) {
      return symbol.index;
    }
  }

  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? (ctx.symbolTable.getSymbol(node.symbolId)?.name ?? node.identifier)
        : undefined;

  throw new LowerError(
    diagnosticMessages.expectedParameterType("hud widget icon", name ?? ""),
    node.location ?? location
  );
};

export const lowerHudWidgetSetIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }

  return {
    type: ActionType.HudWidgetSetIcon,
    parameters: {
      widgetIndex: resolveHudWidgetIndex(parameters[0]!, ctx, location),
      iconIndex: resolveHudWidgetIconIndex(parameters[1]!, ctx, location),
    },
  };
};
