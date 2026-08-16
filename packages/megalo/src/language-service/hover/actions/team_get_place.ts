import { defineActionHover } from "src/language-service/hover/registry";

export const teamGetPlaceHover = defineActionHover("team_get_place", {
  grammar: "action team_get_place <team> <number_out (place)>",
  params: ["team", "number_out"],
});
