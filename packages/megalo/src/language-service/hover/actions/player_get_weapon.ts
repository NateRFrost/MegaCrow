import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetWeaponHover = defineActionHover("player_get_weapon", {
  grammar: "action player_get_weapon <player> {primary|secondary} <weapon_out>",
  params: ["player", "mode", "weapon_out"],
});
