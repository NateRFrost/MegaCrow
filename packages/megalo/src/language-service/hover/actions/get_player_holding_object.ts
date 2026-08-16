import { defineActionHover } from "src/language-service/hover/registry";

export const getPlayerHoldingObjectHover = defineActionHover(
  "get_player_holding_object",
  {
    grammar: "action get_player_holding_object <object> <player_out>",
    params: ["object", "player_out"],
  }
);
