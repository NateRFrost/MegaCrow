import { type ASTElementNode, ElementKind } from "../../abstract-syntax-tree/elements";
import type { ElementLowerContext } from "../parameters/context";
import { baseLowerer } from "./base";
import { engineDataLowerer } from "./engine_data";
import { gameOptionsLowerer } from "./game_options";
import { gameStatsLowerer } from "./game_stats";
import { hudWidgetsLowerer } from "./hud_widgets";
import { loadoutLowerer } from "./loadout";
import { loadoutPaletteLowerer } from "./loadout_palette";
import { mapObjectLowerer } from "./map_object";
import { mapPermissionsLowerer } from "./map_permissions";
import { playerRatingLowerer } from "./player_rating";
import { teamsLowerer } from "./teams";
import { triggersLowerer } from "./triggers";
import { variablesLowerer } from "./variables";

export type ElementLowerer<T extends ASTElementNode> = (
  element: T,
  ctx: ElementLowerContext
) => void;

export const NULL_LOWERER: ElementLowerer<any> = () => {};

export const ELEMENT_LOWERERS = new Map<ElementKind, ElementLowerer<any>>();

// string table is build out by all lowerers
ELEMENT_LOWERERS.set(ElementKind.STRING_TABLE, NULL_LOWERER);
// constants are removed at lower.
ELEMENT_LOWERERS.set(ElementKind.CONSTANTS, NULL_LOWERER);
// includes are expanded at parse time; leftover nodes are ignored.
ELEMENT_LOWERERS.set(ElementKind.INCLUDE, NULL_LOWERER);
ELEMENT_LOWERERS.set(ElementKind.LOCALIZED_INCLUDE, NULL_LOWERER);

ELEMENT_LOWERERS.set(ElementKind.BASE, baseLowerer);
ELEMENT_LOWERERS.set(ElementKind.ENGINE_DATA, engineDataLowerer);
ELEMENT_LOWERERS.set(ElementKind.GAME_OPTIONS, gameOptionsLowerer);
ELEMENT_LOWERERS.set(ElementKind.GAME_STATS, gameStatsLowerer);
ELEMENT_LOWERERS.set(ElementKind.HUD_WIDGETS, hudWidgetsLowerer);
ELEMENT_LOWERERS.set(ElementKind.LOADOUT, loadoutLowerer);
ELEMENT_LOWERERS.set(ElementKind.LOADOUT_PALETTE, loadoutPaletteLowerer);
ELEMENT_LOWERERS.set(ElementKind.MAP_OBJECT, mapObjectLowerer);
ELEMENT_LOWERERS.set(ElementKind.MAP_PERMISSIONS, mapPermissionsLowerer);
ELEMENT_LOWERERS.set(ElementKind.PLAYER_RATING, playerRatingLowerer);
ELEMENT_LOWERERS.set(ElementKind.TEAMS, teamsLowerer);
ELEMENT_LOWERERS.set(ElementKind.TRIGGER, triggersLowerer);
ELEMENT_LOWERERS.set(ElementKind.VARIABLES, variablesLowerer);
