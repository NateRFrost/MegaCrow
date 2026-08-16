import { defineActionHover } from "src/language-service/hover/registry";

export const boundarySetVisibleHover = defineActionHover(
  "boundary_set_visible",
  {
    grammar: "action boundary_set_visible <object> <boolean>",
    params: ["object", "boolean"],
  }
);
