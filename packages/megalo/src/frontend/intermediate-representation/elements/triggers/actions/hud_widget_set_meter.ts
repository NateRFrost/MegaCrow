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
import { HUDMeterInputType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveCustomTimerReference,
  resolveCustomVariableReference,
} from "src/frontend/intermediate-representation/parameters";

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

export const lowerHudWidgetSetMeter = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }

  const widgetIndex = resolveHudWidgetIndex(parameters[0]!, ctx, location);
  const paramCtx = asParameterLoweringContext(ctx);
  const second = parameters[1]!;

  if (second.kind === SyntaxKind.KEYWORD && second.value === "off") {
    return {
      type: ActionType.HudWidgetSetMeter,
      parameters: {
        widgetIndex,
        meterInput: { meterType: HUDMeterInputType.None },
      },
    };
  }

  if (parameters.length === 2) {
    return {
      type: ActionType.HudWidgetSetMeter,
      parameters: {
        widgetIndex,
        meterInput: {
          meterType: HUDMeterInputType.Timer,
          timer: resolveCustomTimerReference(second, paramCtx),
        },
      },
    };
  }

  return {
    type: ActionType.HudWidgetSetMeter,
    parameters: {
      widgetIndex,
      meterInput: {
        meterType: HUDMeterInputType.Number,
        value: resolveCustomVariableReference(second, paramCtx),
        max: resolveCustomVariableReference(parameters[2]!, paramCtx),
      },
    },
  };
};
