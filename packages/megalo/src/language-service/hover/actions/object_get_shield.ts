import { defineActionHover } from "src/language-service/hover/registry";

export const objectGetShieldHover = defineActionHover("object_get_shield", {
  grammar: "action object_get_shield <object> <vitality_out (percent)>",
  params: ["object", "vitality_out"],
});
