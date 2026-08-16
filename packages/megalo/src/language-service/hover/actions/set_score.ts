import { defineActionHover } from "src/language-service/hover/registry";

export const setScoreHover = defineActionHover("set_score", {
  grammar:
    "action set_score <math_operation> <value> {everyone|player <player>|team <team>}",
  params: ["math_operation", "value", "target"],
});
