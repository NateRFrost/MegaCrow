import { defineActionHover } from "src/language-service/hover/registry";

export const setLoadoutHover = defineActionHover("set_loadout", {
  grammar: "action set_loadout <player> <loadout_name>",
  params: ["player", "loadout_name"],
});
