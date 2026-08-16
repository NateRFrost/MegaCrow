import { defineActionHover } from "src/language-service/hover/registry";

export const objectAdjustMaximumHealthHover = defineActionHover(
  "object_adjust_maximum_health",
  {
    grammar:
      "action object_adjust_maximum_health <object> <math_operation> <number>",
    params: ["object", "math_operation", "number"],
  }
);
