import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetMinimapIconHover = defineActionHover(
  "object_set_minimap_icon",
  {
    grammar: "action object_set_minimap_icon <object> <icon>",
    params: ["object", "icon"],
  }
);
