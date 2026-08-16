import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
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

export const lowerHudWidgetSetValue = (
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
    type: ActionType.hud_widget_set_value,
    parameters: {
      widgetIndex: resolveHudWidgetIndex(parameters[0]!, ctx, location),
      value: lowerDynamicString(parameters[1]!, ctx, {
        requirePersistence: true,
      }),
    },
  };
};
