import { defineActionHover } from "src/language-service/hover/registry";

export const deviceSetPowerHover = defineActionHover("device_set_power", {
  grammar: "action device_set_power <object> <number (percent)>",
  params: ["object", "number"],
});
