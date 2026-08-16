import { defineActionHover } from "src/language-service/hover/registry";

export const hudWidgetSetIconHover = defineActionHover("hud_widget_set_icon", {
  grammar: "action hud_widget_set_icon <hud_widget_name> <icon name>",
  params: ["hud_widget_name", "icon_name"],
});
