import { defineActionHover } from "src/language-service/hover/registry";

export const objectGetHealthHover = defineActionHover("object_get_health", {
  grammar: "action object_get_health <object> <vitality_out (percent)>",
  params: ["object", "vitality_out"],
});
