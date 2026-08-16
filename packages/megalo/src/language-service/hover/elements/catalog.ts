import { defineElementHover } from "src/language-service/hover/registry";
import type { HoverContribution } from "src/language-service/hover/types";

/** Hover for every top-level Megalo element keyword. */
export const elementHovers: readonly HoverContribution[] = [
  defineElementHover("base", {
    grammar: 'base "<path>"',
  }),
  defineElementHover("include", {
    grammar: 'include "<path>"',
  }),
  defineElementHover("localized_include", {
    grammar: 'localized_include "<path>"',
  }),
  defineElementHover("string_table", {
    grammar: "string_table … end",
  }),
  defineElementHover("constants", {
    grammar: "constants … end",
    params: ["number"],
  }),
  defineElementHover("variables", {
    grammar: "variables {global|team|player|object} … end",
  }),
  defineElementHover("game_options", {
    grammar: "game_options … end",
  }),
  defineElementHover("hud_widgets", {
    grammar: "hud_widgets … end",
  }),
  defineElementHover("loadout", {
    grammar: "loadout … end",
  }),
  defineElementHover("loadout_palette", {
    grammar: "loadout_palette … end",
  }),
  defineElementHover("teams", {
    grammar: "teams … end",
  }),
  defineElementHover("engine_data", {
    grammar: "engine_data … end",
  }),
  defineElementHover("player_rating", {
    grammar: "player_rating … end",
  }),
  defineElementHover("map_permissions", {
    grammar: "map_permissions … end",
  }),
  defineElementHover("game_stats", {
    grammar: "game_stats … end",
  }),
  defineElementHover("map_object", {
    grammar: "map_object … end",
  }),
  defineElementHover("requisition_palette", {
    grammar: "requisition_palette … end",
  }),
  defineElementHover("trigger", {
    grammar:
      "trigger {initialization|local_initialization|host_migration|double_host_migration|object_incident|incident|spawn|player|team|object|general|…} … end",
  }),
];
