import { defineActionHover } from "src/language-service/hover/registry";

export const hudWidgetSetMeterHover = defineActionHover(
  "hud_widget_set_meter",
  {
    grammar:
      "action hud_widget_set_meter <hud_widget_name> {off|<number> <number>|<timer>}",
    params: ["hud_widget_name", "meter"],
  }
);
