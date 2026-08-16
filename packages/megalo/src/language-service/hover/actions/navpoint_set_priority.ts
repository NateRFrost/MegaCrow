import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetPriorityHover = defineActionHover(
  "navpoint_set_priority",
  {
    grammar: "action navpoint_set_priority <object> {low|normal|high|blink}",
    params: ["object", "priority"],
  }
);
