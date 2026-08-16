import { defineActionHover } from "src/language-service/hover/registry";

export const setHover = defineActionHover("set", {
  grammar: "action set <var_a> <math_operation> <var_b>",
  params: ["var_a", "math_operation", "var_b"],
});
