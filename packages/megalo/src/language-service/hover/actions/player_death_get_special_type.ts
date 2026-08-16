import { defineActionHover } from "src/language-service/hover/registry";

export const playerDeathGetSpecialTypeHover = defineActionHover(
  "player_death_get_special_type",
  {
    grammar:
      "action player_death_get_special_type <dead_player> <number_out (special type)>",
    params: ["dead_player", "number_out"],
  }
);
