import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetEquipmentHover = defineActionHover(
  "player_get_equipment",
  {
    grammar: "action player_get_equipment <player> <equipment_out>",
    params: ["player", "equipment_out"],
  }
);
