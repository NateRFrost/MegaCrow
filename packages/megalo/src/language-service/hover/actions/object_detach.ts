import { defineActionHover } from "src/language-service/hover/registry";

export const objectDetachHover = defineActionHover("object_detach", {
  grammar: "action object_detach <child_object>",
  params: ["child_object"],
});
