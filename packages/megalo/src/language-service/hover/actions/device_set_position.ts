import { defineActionHover } from "src/language-service/hover/registry";

export const deviceSetPositionHover = defineActionHover("device_set_position", {
  grammar: "action device_set_position <object> <number (percent)>",
  params: ["object", "number"],
});
