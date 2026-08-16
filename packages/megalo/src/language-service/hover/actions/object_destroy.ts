import { defineActionHover } from "src/language-service/hover/registry";

export const objectDestroyHover = defineActionHover("object_destroy", {
  grammar: "action object_destroy <object> [no_statistics]",
  params: ["object"],
});
