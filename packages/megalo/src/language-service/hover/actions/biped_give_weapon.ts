import { defineActionHover } from "src/language-service/hover/registry";

export const bipedGiveWeaponHover = defineActionHover("biped_give_weapon", {
  grammar:
    "action biped_give_weapon <biped> <weapon> {primary|secondary|force}",
  params: ["biped", "weapon", "mode"],
});
