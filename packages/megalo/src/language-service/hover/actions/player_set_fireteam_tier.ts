import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetFireteamTierHover = defineActionHover(
  "player_set_fireteam_tier",
  {
    grammar: "action player_set_fireteam_tier <player> <tier>",
    params: ["player", "tier"],
  }
);
