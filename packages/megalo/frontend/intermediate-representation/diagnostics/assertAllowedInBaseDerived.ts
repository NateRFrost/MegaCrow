import {
  type ASTElementNode,
  ElementKind,
} from "../../abstract-syntax-tree/elements";
import { diagnosticMessages } from "../../diagnostics/messages";
import { LowerError } from "../error";
import type { ElementLowerContext } from "../parameters/context";

const BASE_DERIVED_ALLOWED = new Set<ElementKind>([
  ElementKind.BASE,
  ElementKind.ENGINE_DATA,
  ElementKind.TEAMS,
  ElementKind.GAME_OPTIONS,
  ElementKind.CONSTANTS,
  ElementKind.STRING_TABLE,
  ElementKind.INCLUDE,
  ElementKind.LOCALIZED_INCLUDE,
  ElementKind.LOADOUT,
  ElementKind.LOADOUT_PALETTE,
  ElementKind.MAP_PERMISSIONS,
  ElementKind.PLAYER_RATING,
]);

const elementKindLabel = (kind: ElementKind): string => {
  switch (kind) {
    case ElementKind.BASE:
      return "base";
    case ElementKind.INCLUDE:
      return "include";
    case ElementKind.LOCALIZED_INCLUDE:
      return "localized_include";
    case ElementKind.STRING_TABLE:
      return "string_table";
    case ElementKind.CONSTANTS:
      return "constants";
    case ElementKind.VARIABLES:
      return "variables";
    case ElementKind.GAME_OPTIONS:
      return "game_options";
    case ElementKind.HUD_WIDGETS:
      return "hud_widgets";
    case ElementKind.LOADOUT:
      return "loadout";
    case ElementKind.LOADOUT_PALETTE:
      return "loadout_palette";
    case ElementKind.TEAMS:
      return "teams";
    case ElementKind.ENGINE_DATA:
      return "engine_data";
    case ElementKind.PLAYER_RATING:
      return "player_rating";
    case ElementKind.MAP_PERMISSIONS:
      return "map_permissions";
    case ElementKind.GAME_STATS:
      return "game_stats";
    case ElementKind.MAP_OBJECT:
      return "map_object";
    case ElementKind.REQUISITION_PALETTE:
      return "requisition_palette";
    case ElementKind.TRIGGER:
      return "trigger";
    default: {
      const _exhaustive: never = kind;
      return String(_exhaustive);
    }
  }
};

export const isBaseDerived = (ctx: ElementLowerContext): boolean =>
  ctx.ir.baseFilePath !== undefined;

export const assertAllowedInBaseDerived = (
  element: ASTElementNode,
  ctx: ElementLowerContext
): void => {
  if (!isBaseDerived(ctx)) {
    return;
  }
  if (BASE_DERIVED_ALLOWED.has(element.elementKind)) {
    return;
  }
  throw new LowerError(
    diagnosticMessages.elementNotAllowedInBaseDerived(
      elementKindLabel(element.elementKind)
    ),
    element.keywordLocation
  );
};
