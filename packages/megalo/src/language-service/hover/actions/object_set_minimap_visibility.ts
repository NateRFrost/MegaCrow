import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetMinimapVisibilityHover = defineActionHover(
  "object_set_minimap_visibility",
  {
    grammar: "action object_set_minimap_visibility <object> <boolean>",
    params: ["object", "boolean"],
  }
);
