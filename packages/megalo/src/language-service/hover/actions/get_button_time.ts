import { defineActionHover } from "src/language-service/hover/registry";

export const getButtonTimeHover = defineActionHover("get_button_time", {
  grammar:
    "action get_button_time <player> <scriptable_button> <milliseconds_out>",
  params: ["player", "scriptable_button", "milliseconds_out"],
});
