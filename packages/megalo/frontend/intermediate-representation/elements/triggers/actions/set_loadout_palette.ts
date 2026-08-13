import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  LOADOUT_PALETTE_TYPE_BY_NAME,
  type LoadoutPaletteType,
} from "../../../game/megalogamengine/LoadoutPaletteType";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "../../../parameters/context";
import { parseTeamOrPlayerTarget } from "../helpers";

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

