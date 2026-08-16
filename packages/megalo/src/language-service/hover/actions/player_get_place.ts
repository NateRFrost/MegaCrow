import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetPlaceHover = defineActionHover("player_get_place", {
  grammar: "action player_get_place <player> <number_out (place)>",
  params: ["player", "number_out"],
});
