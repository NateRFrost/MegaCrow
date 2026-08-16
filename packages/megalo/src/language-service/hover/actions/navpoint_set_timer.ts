import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetTimerHover = defineActionHover("navpoint_set_timer", {
  grammar: "action navpoint_set_timer <object> <timer_name>",
  params: ["object", "timer_name"],
});
