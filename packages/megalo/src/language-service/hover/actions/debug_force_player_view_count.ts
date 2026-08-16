import { defineActionHover } from "src/language-service/hover/registry";

export const debugForcePlayerViewCountHover = defineActionHover(
  "debug_force_player_view_count",
  {
    grammar: "action debug_force_player_view_count <splitscreen_count>",
    params: ["splitscreen_count"],
  }
);
