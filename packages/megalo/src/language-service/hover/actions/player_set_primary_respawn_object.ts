import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetPrimaryRespawnObjectHover = defineActionHover(
  "player_set_primary_respawn_object",
  {
    grammar: "action player_set_primary_respawn_object <player> <object>",
    params: ["player", "object"],
  }
);
