import { defineActionHover } from "src/language-service/hover/registry";

export const setLoadoutPaletteHover = defineActionHover("set_loadout_palette", {
  grammar: "action set_loadout_palette <team_or_player> <loadout>",
  params: ["team_or_player", "loadout"],
});
