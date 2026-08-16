import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetUnitHover = defineActionHover("player_set_unit", {
  grammar: "action player_set_unit <player> <unit>",
  params: ["player", "unit"],
});
