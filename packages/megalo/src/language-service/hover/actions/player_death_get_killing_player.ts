import { defineActionHover } from "src/language-service/hover/registry";

export const playerDeathGetKillingPlayerHover = defineActionHover(
  "player_death_get_killing_player",
  {
    grammar:
      "action player_death_get_killing_player <dead_player> <killing_player>",
    params: ["dead_player", "killing_player"],
  }
);
