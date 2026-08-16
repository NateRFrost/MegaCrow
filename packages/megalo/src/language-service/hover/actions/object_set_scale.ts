import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetScaleHover = defineActionHover("object_set_scale", {
  grammar: "action object_set_scale <object> <number (percent)>",
  params: ["object", "number"],
});
