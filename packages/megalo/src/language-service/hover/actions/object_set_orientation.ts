import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetOrientationHover = defineActionHover(
  "object_set_orientation",
  {
    grammar:
      "action object_set_orientation <object> <source> [absolute_orientation]",
    params: ["object", "source"],
  }
);
