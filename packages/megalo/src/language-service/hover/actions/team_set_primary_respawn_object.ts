import { defineActionHover } from "src/language-service/hover/registry";

export const teamSetPrimaryRespawnObjectHover = defineActionHover(
  "team_set_primary_respawn_object",
  {
    grammar: "action team_set_primary_respawn_object <team> <object>",
    params: ["team", "object"],
  }
);
