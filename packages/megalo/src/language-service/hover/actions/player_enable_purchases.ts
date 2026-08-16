import { defineActionHover } from "src/language-service/hover/registry";

export const playerEnablePurchasesHover = defineActionHover(
  "player_enable_purchases",
  {
    grammar:
      "action player_enable_purchases <player> {alive|dead|both} <boolean>",
    params: ["player", "when", "boolean"],
  }
);
