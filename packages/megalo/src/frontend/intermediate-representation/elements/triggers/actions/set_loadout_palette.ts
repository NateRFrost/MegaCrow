import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  LOADOUT_PALETTE_TYPE_BY_NAME,
  type LoadoutPaletteType,
} from "src/frontend/intermediate-representation/game/megalogamengine/LoadoutPaletteType";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { parseTeamOrPlayerTarget } from "src/frontend/intermediate-representation/elements/triggers/helpers";

const resolveLoadoutPaletteType = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): LoadoutPaletteType => {
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette type", ""),
      node.location ?? location
    );
  }
  const type = LOADOUT_PALETTE_TYPE_BY_NAME[name];
  if (type === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("loadout palette type", name),
      node.location
    );
  }
  return type;
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

  return {
    type: ActionType.SetLoadoutPalette,
    parameters: {
      target,
      loadoutPaletteIndex: resolveLoadoutPaletteType(paletteNode, location),
    },
  };
};

