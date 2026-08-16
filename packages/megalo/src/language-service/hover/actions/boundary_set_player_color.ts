import { defineActionHover } from "src/language-service/hover/registry";

export const boundarySetPlayerColorHover = defineActionHover(
  "boundary_set_player_color",
  {
    grammar:
      "action boundary_set_player_color <object> <player variable name> (must be member of object)",
    params: ["object", "player_variable_name"],
  }
);
