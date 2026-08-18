import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetScaleHover = defineActionHover("object_set_scale", {
  grammar:
    "action object_set_scale <object> <float | number (percent / variable)>",
  params: ["object", "float or number"],
});
