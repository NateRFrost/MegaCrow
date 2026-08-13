import { type ASTElementNode, ElementKind } from "src/frontend/abstract-syntax-tree/elements";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { baseLowerer } from "src/frontend/intermediate-representation/elements/base";
import { engineDataLowerer } from "src/frontend/intermediate-representation/elements/engine_data";
import { gameOptionsLowerer } from "src/frontend/intermediate-representation/elements/game_options";
import { gameStatsLowerer } from "src/frontend/intermediate-representation/elements/game_stats";
import { hudWidgetsLowerer } from "src/frontend/intermediate-representation/elements/hud_widgets";
import { loadoutLowerer } from "src/frontend/intermediate-representation/elements/loadout";
import { loadoutPaletteLowerer } from "src/frontend/intermediate-representation/elements/loadout_palette";
import { mapObjectLowerer } from "src/frontend/intermediate-representation/elements/map_object";
import { mapPermissionsLowerer } from "src/frontend/intermediate-representation/elements/map_permissions";
import { playerRatingLowerer } from "src/frontend/intermediate-representation/elements/player_rating";
import { teamsLowerer } from "src/frontend/intermediate-representation/elements/teams";
import { triggersLowerer } from "src/frontend/intermediate-representation/elements/triggers";
import { variablesLowerer } from "src/frontend/intermediate-representation/elements/variables";

export type ElementLowerer<T extends ASTElementNode> = (
  element: T,
  ctx: ElementLowerContext
) => void;

export const NULL_LOWERER: ElementLowerer<any> = () => {};

export { baseLowerer };

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
