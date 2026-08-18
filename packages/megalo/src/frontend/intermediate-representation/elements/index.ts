import {
  type ASTElementNode,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
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
import { requisitionPaletteLowerer } from "src/frontend/intermediate-representation/elements/requisition_palette";
import { teamsLowerer } from "src/frontend/intermediate-representation/elements/teams";
import { triggersLowerer } from "src/frontend/intermediate-representation/elements/triggers";
import { variablesLowerer } from "src/frontend/intermediate-representation/elements/variables";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export type ElementLowerer<T extends ASTElementNode> = (
  element: T,
  ctx: ElementLowerContext
) => void;

export const NULL_LOWERER: ElementLowerer<ASTElementNode> = () => {
  // no-op lowerer for parse-time-only / discarded element kinds
};

export { baseLowerer };

export const ELEMENT_LOWERERS = new Map<
  ElementKind,
  ElementLowerer<ASTElementNode>
>();

const registerLowerer = <T extends ASTElementNode>(
  kind: ElementKind,
  lowerer: ElementLowerer<T>
): void => {
  ELEMENT_LOWERERS.set(kind, lowerer as ElementLowerer<ASTElementNode>);
};

// string table is build out by all lowerers
registerLowerer(ElementKind.STRING_TABLE, NULL_LOWERER);
// constants are removed at lower.
registerLowerer(ElementKind.CONSTANTS, NULL_LOWERER);
// includes are expanded at parse time; leftover nodes are ignored.
registerLowerer(ElementKind.INCLUDE, NULL_LOWERER);
registerLowerer(ElementKind.LOCALIZED_INCLUDE, NULL_LOWERER);

registerLowerer(ElementKind.BASE, baseLowerer);
registerLowerer(ElementKind.ENGINE_DATA, engineDataLowerer);
registerLowerer(ElementKind.GAME_OPTIONS, gameOptionsLowerer);
registerLowerer(ElementKind.GAME_STATS, gameStatsLowerer);
registerLowerer(ElementKind.HUD_WIDGETS, hudWidgetsLowerer);
registerLowerer(ElementKind.LOADOUT, loadoutLowerer);
registerLowerer(ElementKind.LOADOUT_PALETTE, loadoutPaletteLowerer);
registerLowerer(ElementKind.REQUISITION_PALETTE, requisitionPaletteLowerer);
registerLowerer(ElementKind.MAP_OBJECT, mapObjectLowerer);
registerLowerer(ElementKind.MAP_PERMISSIONS, mapPermissionsLowerer);
registerLowerer(ElementKind.PLAYER_RATING, playerRatingLowerer);
registerLowerer(ElementKind.TEAMS, teamsLowerer);
registerLowerer(ElementKind.TRIGGER, triggersLowerer);
registerLowerer(ElementKind.VARIABLES, variablesLowerer);
