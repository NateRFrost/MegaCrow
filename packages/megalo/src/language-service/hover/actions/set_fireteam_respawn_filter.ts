import { defineActionHover } from "src/language-service/hover/registry";

export const setFireteamRespawnFilterHover = defineActionHover(
  "set_fireteam_respawn_filter",
  {
    grammar: "action set_fireteam_respawn_filter <object> {none|all|0-3}",
    params: ["object", "fireteam_filter"],
  }
);
