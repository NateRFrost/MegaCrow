import { defineActionHover } from "src/language-service/hover/registry";

export const playerAdjustMoneyHover = defineActionHover("player_adjust_money", {
  grammar: "action player_adjust_money <player> <math_operation> <number>",
  params: ["player", "math_operation", "number"],
});
