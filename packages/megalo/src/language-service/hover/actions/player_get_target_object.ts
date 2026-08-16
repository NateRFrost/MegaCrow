import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetTargetObjectHover = defineActionHover(
  "player_get_target_object",
  {
    grammar: "action player_get_target_object <player> <object_out>",
    params: ["player", "object_out"],
  }
);
