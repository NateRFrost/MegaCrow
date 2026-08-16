import { defineActionHover } from "src/language-service/hover/registry";

export const objectAdjustHealthHover = defineActionHover(
  "object_adjust_health",
  {
    grammar: "action object_adjust_health <object> <math_operation> <number>",
    params: ["object", "math_operation", "number"],
  }
);
