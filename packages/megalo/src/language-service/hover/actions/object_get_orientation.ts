import { defineActionHover } from "src/language-service/hover/registry";

export const objectGetOrientationHover = defineActionHover(
  "object_get_orientation",
  {
    grammar: "action object_get_orientation <object> <orientation_out (1-6)>",
    params: ["object", "orientation_out"],
  }
);
