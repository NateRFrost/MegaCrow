import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetCoopSpawningHover = defineActionHover(
  "player_set_coop_spawning",
  {
    grammar: "action player_set_coop_spawning <player> <literal_boolean>",
    params: ["player", "literal_boolean"],
  }
);
