import { defineActionHover } from "src/language-service/hover/registry";

export const respawnZoneEnableHover = defineActionHover("respawn_zone_enable", {
  grammar: "action respawn_zone_enable <object> <boolean>",
  params: ["object", "boolean"],
});
