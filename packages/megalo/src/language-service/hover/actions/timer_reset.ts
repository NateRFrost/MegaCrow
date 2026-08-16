import { defineActionHover } from "src/language-service/hover/registry";

export const timerResetHover = defineActionHover("timer_reset", {
  grammar: "action timer_reset <timer>",
  params: ["timer"],
});
