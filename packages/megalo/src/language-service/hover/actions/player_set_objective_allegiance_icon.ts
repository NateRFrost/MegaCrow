import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetObjectiveAllegianceIconHover = defineActionHover(
  "player_set_objective_allegiance_icon",
  {
    grammar:
      "action player_set_objective_allegiance_icon <player> <constant_integer (engine icon index)>",
    params: ["player", "constant_integer"],
  }
);
