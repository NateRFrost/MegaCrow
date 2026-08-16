import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetFireteamIndexHover = defineActionHover(
  "player_get_fireteam_index",
  {
    grammar: "action player_get_fireteam_index <player> <number_out>",
    params: ["player", "number_out"],
  }
);
