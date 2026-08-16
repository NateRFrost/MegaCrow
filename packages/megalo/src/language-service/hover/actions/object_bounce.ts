import { defineActionHover } from "src/language-service/hover/registry";

export const objectBounceHover = defineActionHover("object_bounce", {
  grammar: "action object_bounce <object>",
  params: ["object"],
});
