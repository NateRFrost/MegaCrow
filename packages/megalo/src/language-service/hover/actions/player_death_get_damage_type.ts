import { defineActionHover } from "src/language-service/hover/registry";

export const playerDeathGetDamageTypeHover = defineActionHover(
  "player_death_get_damage_type",
  {
    grammar:
      "action player_death_get_damage_type <dead_player> <number_out (damage type)>",
    params: ["dead_player", "number_out"],
  }
);
