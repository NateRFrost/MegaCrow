import { defineActionHover } from "src/language-service/hover/registry";

export const deleteObjectHover = defineActionHover("delete_object", {
  grammar: "action delete_object <object>",
  params: ["object"],
});
