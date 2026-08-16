import { defineConditionHover } from "src/language-service/hover/registry";

export const objectIsTypeHover = defineConditionHover("object_is_type", {
  grammar: "condition object_is_type <object> <object_type>",
  params: ["object", "object_type"],
});
