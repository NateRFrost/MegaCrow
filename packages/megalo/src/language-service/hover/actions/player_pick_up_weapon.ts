import { defineActionHover } from "src/language-service/hover/registry";

export const playerPickUpWeaponHover = defineActionHover(
  "player_pick_up_weapon",
  {
    grammar: "action player_pick_up_weapon <player> <weapon object>",
    params: ["player", "weapon_object"],
  }
);
