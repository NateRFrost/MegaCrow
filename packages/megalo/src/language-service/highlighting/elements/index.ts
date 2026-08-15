import {
  ElementKind,
  type ASTElementNode,
} from "src/frontend/abstract-syntax-tree/elements";
import { highlightBase } from "src/language-service/highlighting/elements/base";
import { highlightInclude } from "src/language-service/highlighting/elements/include";
import { highlightLocalizedInclude } from "src/language-service/highlighting/elements/localized_include";
import { highlightStringTable } from "src/language-service/highlighting/elements/string_table";
import { highlightConstants } from "src/language-service/highlighting/elements/constants";
import { highlightVariables } from "src/language-service/highlighting/elements/variables";
import { highlightGameOptions } from "src/language-service/highlighting/elements/game_options";
import { highlightHudWidgets } from "src/language-service/highlighting/elements/hud_widgets";
import { highlightLoadout } from "src/language-service/highlighting/elements/loadout";
import { highlightLoadoutPalette } from "src/language-service/highlighting/elements/loadout_palette";
import { highlightTeams } from "src/language-service/highlighting/elements/teams";
import { highlightEngineData } from "src/language-service/highlighting/elements/engine_data";
import { highlightPlayerRating } from "src/language-service/highlighting/elements/player_rating";
import { highlightMapPermissions } from "src/language-service/highlighting/elements/map_permissions";
import { highlightGameStats } from "src/language-service/highlighting/elements/game_stats";
import { highlightMapObject } from "src/language-service/highlighting/elements/map_object";
import { highlightRequisitionPalette } from "src/language-service/highlighting/elements/requisition_palette";
import { highlightTrigger } from "src/language-service/highlighting/elements/trigger";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** Dispatch highlighting for a top-level AST element. */
export const highlightElement = (
  out: SemanticToken[],
  element: ASTElementNode
): void => {
  switch (element.elementKind) {
    case ElementKind.BASE:
      highlightBase(out, element);
      break;
    case ElementKind.INCLUDE:
      highlightInclude(out, element);
      break;
    case ElementKind.LOCALIZED_INCLUDE:
      highlightLocalizedInclude(out, element);
      break;
    case ElementKind.STRING_TABLE:
      highlightStringTable(out, element);
      break;
    case ElementKind.CONSTANTS:
      highlightConstants(out, element);
      break;
    case ElementKind.VARIABLES:
      highlightVariables(out, element);
      break;
    case ElementKind.GAME_OPTIONS:
      highlightGameOptions(out, element);
      break;
    case ElementKind.HUD_WIDGETS:
      highlightHudWidgets(out, element);
      break;
    case ElementKind.LOADOUT:
      highlightLoadout(out, element);
      break;
    case ElementKind.LOADOUT_PALETTE:
      highlightLoadoutPalette(out, element);
      break;
    case ElementKind.TEAMS:
      highlightTeams(out, element);
      break;
    case ElementKind.ENGINE_DATA:
      highlightEngineData(out, element);
      break;
    case ElementKind.PLAYER_RATING:
      highlightPlayerRating(out, element);
      break;
    case ElementKind.MAP_PERMISSIONS:
      highlightMapPermissions(out, element);
      break;
    case ElementKind.GAME_STATS:
      highlightGameStats(out, element);
      break;
    case ElementKind.MAP_OBJECT:
      highlightMapObject(out, element);
      break;
    case ElementKind.REQUISITION_PALETTE:
      highlightRequisitionPalette(out, element);
      break;
    case ElementKind.TRIGGER:
      highlightTrigger(out, element);
      break;
    default: {
      const _exhaustive: never = element;
      return _exhaustive;
    }
  }
};
