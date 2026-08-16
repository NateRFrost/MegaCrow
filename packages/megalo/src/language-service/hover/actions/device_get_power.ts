import { defineActionHover } from "src/language-service/hover/registry";

export const deviceGetPowerHover = defineActionHover("device_get_power", {
  grammar: "action device_get_power <object> <number_out (percent)>",
  params: ["object", "number_out"],
});
