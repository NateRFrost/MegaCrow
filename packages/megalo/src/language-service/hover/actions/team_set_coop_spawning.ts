import { defineActionHover } from "src/language-service/hover/registry";

export const teamSetCoopSpawningHover = defineActionHover(
  "team_set_coop_spawning",
  {
    grammar: "action team_set_coop_spawning <team> <literal_boolean>",
    params: ["team", "literal_boolean"],
  }
);
