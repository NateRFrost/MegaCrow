import {
  type ASTElementNode,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import { completeBase } from "src/language-service/completion/elements/base";
import { completeConstants } from "src/language-service/completion/elements/constants";
import { completeEngineData } from "src/language-service/completion/elements/engine_data";
import { completeGameOptions } from "src/language-service/completion/elements/game_options";
import { completeGameStats } from "src/language-service/completion/elements/game_stats";
import { completeHudWidgets } from "src/language-service/completion/elements/hud_widgets";
import { completeInclude } from "src/language-service/completion/elements/include";
import { completeLoadout } from "src/language-service/completion/elements/loadout";
import { completeLoadoutPalette } from "src/language-service/completion/elements/loadout_palette";
import { completeLocalizedInclude } from "src/language-service/completion/elements/localized_include";
import { completeMapObject } from "src/language-service/completion/elements/map_object";
import { completeMapPermissions } from "src/language-service/completion/elements/map_permissions";
import { completePlayerRating } from "src/language-service/completion/elements/player_rating";
import { completeRequisitionPalette } from "src/language-service/completion/elements/requisition_palette";
import { completeStringTable } from "src/language-service/completion/elements/string_table";
import { completeTeams } from "src/language-service/completion/elements/teams";
import { completeVariables } from "src/language-service/completion/elements/variables";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

/** Dispatch element-body completions for a top-level AST element. */
export const completeElement = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element: ASTElementNode = ctx.element;
  switch (element.elementKind) {
    case ElementKind.BASE:
      return completeBase(ctx);
    case ElementKind.INCLUDE:
      return completeInclude(ctx);
    case ElementKind.LOCALIZED_INCLUDE:
      return completeLocalizedInclude(ctx);
    case ElementKind.STRING_TABLE:
      return completeStringTable(ctx);
    case ElementKind.CONSTANTS:
      return completeConstants(ctx);
    case ElementKind.VARIABLES:
      return completeVariables(ctx);
    case ElementKind.GAME_OPTIONS:
      return completeGameOptions(ctx);
    case ElementKind.HUD_WIDGETS:
      return completeHudWidgets(ctx);
    case ElementKind.LOADOUT:
      return completeLoadout(ctx);
    case ElementKind.LOADOUT_PALETTE:
      return completeLoadoutPalette(ctx);
    case ElementKind.TEAMS:
      return completeTeams(ctx);
    case ElementKind.ENGINE_DATA:
      return completeEngineData(ctx);
    case ElementKind.PLAYER_RATING:
      return completePlayerRating(ctx);
    case ElementKind.MAP_PERMISSIONS:
      return completeMapPermissions(ctx);
    case ElementKind.GAME_STATS:
      return completeGameStats(ctx);
    case ElementKind.MAP_OBJECT:
      return completeMapObject(ctx);
    case ElementKind.REQUISITION_PALETTE:
      return completeRequisitionPalette(ctx);
    case ElementKind.TRIGGER:
      return [];
    default: {
      const _exhaustive: never = element;
      void _exhaustive;
      return [];
    }
  }
};
