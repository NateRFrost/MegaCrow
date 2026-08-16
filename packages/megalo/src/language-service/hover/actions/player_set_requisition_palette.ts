import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetRequisitionPaletteHover = defineActionHover(
  "player_set_requisition_palette",
  {
    grammar:
      "action player_set_requisition_palette <player> <req_palette_name>",
    params: ["player", "req_palette_name"],
  }
);
