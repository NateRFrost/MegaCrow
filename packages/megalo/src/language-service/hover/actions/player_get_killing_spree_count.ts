import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetKillingSpreeCountHover = defineActionHover(
  "player_get_killing_spree_count",
  {
    grammar: "action player_get_killing_spree_count <player> <number_out>",
    params: ["player", "number_out"],
  }
);
