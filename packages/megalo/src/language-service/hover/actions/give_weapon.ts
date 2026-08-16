import { defineActionHover } from "src/language-service/hover/registry";

export const giveWeaponHover = defineActionHover("give_weapon", {
  grammar: "action give_weapon <player> <weapon> {primary|secondary|force}",
  params: ["player", "weapon", "mode"],
});
