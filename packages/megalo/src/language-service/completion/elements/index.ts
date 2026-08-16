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
import { hoverDocumentationForId } from "src/language-service/hover";
import { elementKeywordId } from "src/language-service/hover/resolve";

const withElementParamDocs = (
  element: ASTElementNode,
  items: readonly CompletionItem[]
): CompletionItem[] => {
  const elementId = elementKeywordId(element);
  if (elementId === undefined) {
    return [...items];
  }
  return items.map((item) => {
    const documentation =
      hoverDocumentationForId("param", `${elementId}.${item.label}`) ??
      hoverDocumentationForId("keyword", item.label);
    return documentation === undefined ? item : { ...item, documentation };
  });
};

/** Dispatch element-body completions for a top-level AST element. */
export const completeElement = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element: ASTElementNode = ctx.element;
  let items: CompletionItem[];
  switch (element.elementKind) {
    case ElementKind.BASE:
      items = completeBase(ctx);
      break;
    case ElementKind.INCLUDE:
      items = completeInclude(ctx);
      break;
    case ElementKind.LOCALIZED_INCLUDE:
      items = completeLocalizedInclude(ctx);
      break;
    case ElementKind.STRING_TABLE:
      items = completeStringTable(ctx);
      break;
    case ElementKind.CONSTANTS:
      items = completeConstants(ctx);
      break;
    case ElementKind.VARIABLES:
      items = completeVariables(ctx);
      break;
    case ElementKind.GAME_OPTIONS:
      items = completeGameOptions(ctx);
      break;
    case ElementKind.HUD_WIDGETS:
      items = completeHudWidgets(ctx);
      break;
    case ElementKind.LOADOUT:
      items = completeLoadout(ctx);
      break;
    case ElementKind.LOADOUT_PALETTE:
      items = completeLoadoutPalette(ctx);
      break;
    case ElementKind.TEAMS:
      items = completeTeams(ctx);
      break;
    case ElementKind.ENGINE_DATA:
      items = completeEngineData(ctx);
      break;
    case ElementKind.PLAYER_RATING:
      items = completePlayerRating(ctx);
      break;
    case ElementKind.MAP_PERMISSIONS:
      items = completeMapPermissions(ctx);
      break;
    case ElementKind.GAME_STATS:
      items = completeGameStats(ctx);
      break;
    case ElementKind.MAP_OBJECT:
      items = completeMapObject(ctx);
      break;
    case ElementKind.REQUISITION_PALETTE:
      items = completeRequisitionPalette(ctx);
      break;
    case ElementKind.TRIGGER:
      return [];
    default: {
      const _exhaustive: never = element;
      void _exhaustive;
      return [];
    }
  }
  return withElementParamDocs(element, items);
};
