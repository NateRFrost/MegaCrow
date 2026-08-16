import { defineActionHover } from "src/language-service/hover/registry";

export const hudWidgetSetValueHover = defineActionHover(
  "hud_widget_set_value",
  {
    grammar: "action hud_widget_set_value <hud_widget_name> <dynamic_string>",
    params: ["hud_widget_name", "dynamic_string"],
  }
);
