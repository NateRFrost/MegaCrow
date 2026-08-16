import { defineActionHover } from "src/language-service/hover/registry";

export const hudWidgetSetVisibilityHover = defineActionHover(
  "hud_widget_set_visibility",
  {
    grammar:
      "action hud_widget_set_visibility <hud_widget_name> <player> <literal_boolean>",
    params: ["hud_widget_name", "player", "literal_boolean"],
  }
);
