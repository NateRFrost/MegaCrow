import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetVisibleRangeHover = defineActionHover(
  "navpoint_set_visible_range",
  {
    grammar:
      "action navpoint_set_visible_range <object> <min (feet)> <max (feet)>",
    params: ["object", "min", "max"],
  }
);
