import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetObjectiveAllegianceHover = defineActionHover(
  "player_set_objective_allegiance",
  {
    grammar: "action player_set_objective_allegiance <player> <dynamic_string>",
    params: ["player", "dynamic_string"],
  }
);
