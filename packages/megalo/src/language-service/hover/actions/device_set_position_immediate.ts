import { defineActionHover } from "src/language-service/hover/registry";

export const deviceSetPositionImmediateHover = defineActionHover(
  "device_set_position_immediate",
  {
    grammar: "action device_set_position_immediate <object> <number (percent)>",
    params: ["object", "number"],
  }
);
