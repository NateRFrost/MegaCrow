import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetFireteamIndexHover = defineActionHover(
  "player_set_fireteam_index",
  {
    grammar: "action player_set_fireteam_index <player> <number>",
    params: ["player", "number"],
  }
);
