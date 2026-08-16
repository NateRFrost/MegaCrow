import { defineActionHover } from "src/language-service/hover/registry";

export const timerSetRateHover = defineActionHover("timer_set_rate", {
  grammar: "action timer_set_rate <timer> <rate>",
  params: ["timer", "rate"],
});
