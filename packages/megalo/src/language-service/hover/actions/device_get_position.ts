import { defineActionHover } from "src/language-service/hover/registry";

export const deviceGetPositionHover = defineActionHover("device_get_position", {
  grammar: "action device_get_position <object> <number_out (percent)>",
  params: ["object", "number_out"],
});
