import { defineActionHover } from "src/language-service/hover/registry";

export const adjustGrenadesHover = defineActionHover("adjust_grenades", {
  grammar:
    "action adjust_grenades <player> {frag|plasma} <math_operation> <number>",
  params: ["player", "grenade_type", "math_operation", "number"],
});
