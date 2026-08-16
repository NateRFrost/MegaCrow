import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetObjectiveHover = defineActionHover(
  "player_set_objective",
  {
    grammar: "action player_set_objective <player> <dynamic_string>",
    params: ["player", "dynamic_string"],
  }
);
