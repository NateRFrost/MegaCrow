import { defineConditionHover } from "src/language-service/hover/registry";
import type { HoverContribution } from "src/language-service/hover/types";

/** Hover for every Megalo condition type. */
export const conditionHovers: readonly HoverContribution[] = [
  defineConditionHover("if", {
    grammar:
      "condition [not] if <left> {==|!=|<|=|>|>=|equal_to|…} <right> [or]",
    params: ["left", "operator", "right"],
  }),
  defineConditionHover("object_in_area", {
    grammar: "condition [not] object_in_area <object> <area> [or]",
  }),
  defineConditionHover("player_died", {
    grammar:
      "condition [not] player_died <player> {enemy|suicide|betrayal|environment|guardian|quit_game|any|none} [or]",
  }),
  defineConditionHover("team_disposition", {
    grammar:
      "condition [not] team_disposition <team1> <disposition> <team2> [or]",
  }),
  defineConditionHover("timer_expired", {
    grammar: "condition [not] timer_expired <timer> [or]",
  }),
  defineConditionHover("object_is_type", {
    grammar: 'condition [not] object_is_type <object> "<object_type>" [or]',
    params: ["object", "object_type"],
  }),
  defineConditionHover("team_is_active", {
    grammar: "condition [not] team_is_active <team> [or]",
  }),
  defineConditionHover("object_out_of_bounds", {
    grammar: "condition [not] object_out_of_bounds <object> [or]",
  }),
  defineConditionHover("player_is_fire_team_leader", {
    grammar: "condition [not] player_is_fire_team_leader <player> [or]",
  }),
  defineConditionHover("player_assisted_with_kill", {
    grammar: "condition [not] player_assisted_with_kill <player> [or]",
  }),
  defineConditionHover("object_matches_filter", {
    grammar: "condition [not] object_matches_filter <object> <filter> [or]",
  }),
  defineConditionHover("player_is_active", {
    grammar: "condition [not] player_is_active <player> [or]",
  }),
  defineConditionHover("equipment_is_active", {
    grammar: "condition [not] equipment_is_active <player> [or]",
  }),
  defineConditionHover("player_is_spartan", {
    grammar: "condition [not] player_is_spartan <player> [or]",
  }),
  defineConditionHover("player_is_elite", {
    grammar: "condition [not] player_is_elite <player> [or]",
  }),
  defineConditionHover("player_is_editor", {
    grammar: "condition [not] player_is_editor <player> [or]",
  }),
  defineConditionHover("game_is_forge", {
    grammar: "condition [not] game_is_forge [or]",
  }),
];
