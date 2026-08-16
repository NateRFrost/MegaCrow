import { defineActionHover } from "src/language-service/hover/registry";

export const hudWidgetSetTextHover = defineActionHover("hud_widget_set_text", {
  grammar: "action hud_widget_set_text <hud_widget_name> <dynamic_string>",
  params: ["hud_widget_name", "dynamic_string"],
});
