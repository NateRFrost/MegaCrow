import { defineActionHover } from "src/language-service/hover/registry";

export const objectAdjustShieldHover = defineActionHover(
  "object_adjust_shield",
  {
    grammar: "action object_adjust_shield <object> <math_operation> <number>",
    params: ["object", "math_operation", "number"],
  }
);
