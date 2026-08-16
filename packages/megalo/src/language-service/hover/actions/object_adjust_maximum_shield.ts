import { defineActionHover } from "src/language-service/hover/registry";

export const objectAdjustMaximumShieldHover = defineActionHover(
  "object_adjust_maximum_shield",
  {
    grammar:
      "action object_adjust_maximum_shield <object> <math_operation> <number>",
    params: ["object", "math_operation", "number"],
  }
);
