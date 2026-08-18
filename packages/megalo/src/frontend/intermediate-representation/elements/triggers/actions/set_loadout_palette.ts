import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { parseTeamOrPlayerTarget } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type LoadoutPaletteType,
  loadoutPaletteType,
} from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

type ResolvedLoadoutPalette =
  | { loadoutPaletteType: LoadoutPaletteType }
  | { loadoutPaletteIndex: number };

const resolveLoadoutPalette = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): ResolvedLoadoutPalette => {
  const usesPaletteType = ctx.frontend.megaloVersion.version >= 106;

  if (node.kind === SyntaxKind.INTEGER) {
    if (usesPaletteType) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "loadout palette type",
          String(node.value)
        ),
        node.location ?? location
      );
    }
    return { loadoutPaletteIndex: node.value };
  }

  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? (ctx.symbolTable.getSymbol(node.symbolId)?.name ?? node.identifier)
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        usesPaletteType ? "loadout palette type" : "loadout palette",
        ""
      ),
      node.location ?? location
    );
  }

  // <106: object_lists/loadout_palettes.txt (8-bit index).
  if (!usesPaletteType) {
    if (node.kind === SyntaxKind.REFERENCE) {
      const symbol = ctx.symbolTable.getSymbol(node.symbolId);
      if (
        symbol?.kind === SymbolKind.ObjectListItem &&
        symbol.objectType === ObjectListType.LoadoutPalettes &&
        symbol.index >= 0
      ) {
        return { loadoutPaletteIndex: symbol.index };
      }
    }
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette", name),
      node.location ?? location
    );
  }

  // >=106: MegaloEdit LoadoutPaletteType — encode at compile.
  const type = loadoutPaletteType.parse(name);
  if (type === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette type", name),
      node.location ?? location
    );
  }
  return { loadoutPaletteType: type };
};

export const lowerSetLoadoutPalette = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location
    );
  }

  const { target, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    0,
    ctx,
    location
  );
  const paletteNode = parameters[nextIndex];
  if (paletteNode === undefined || nextIndex + 1 !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        nextIndex + 1,
        parameters.length
      ),
      location
    );
  }

  const palette = resolveLoadoutPalette(paletteNode, ctx, location);
  const action: Action = {
    type: ActionType.set_loadout_palette,
    parameters: {
      target,
      ...palette,
    },
  };
  if ("loadoutPaletteType" in palette) {
    ctx.ir.locations.record(
      action.parameters,
      "loadoutPaletteType",
      paletteNode.location
    );
  } else {
    ctx.ir.locations.record(
      action.parameters,
      "loadoutPaletteIndex",
      paletteNode.location
    );
  }
  return action;
};
