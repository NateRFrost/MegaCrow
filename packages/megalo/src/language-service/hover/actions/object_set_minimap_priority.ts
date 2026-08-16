import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetMinimapPriorityHover = defineActionHover(
  "object_set_minimap_priority",
  {
    grammar:
      "action object_set_minimap_priority <object> {low|normal|high|blink}",
    params: ["object", "priority"],
  }
);
