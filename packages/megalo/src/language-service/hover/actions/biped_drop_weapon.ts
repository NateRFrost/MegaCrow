import { defineActionHover } from "src/language-service/hover/registry";

export const bipedDropWeaponHover = defineActionHover("biped_drop_weapon", {
  grammar:
    "action biped_drop_weapon <biped> {primary|secondary} [delete_on_drop]",
  params: ["biped", "mode"],
});
