import { defineActionHover } from "src/language-service/hover/registry";

export const forEachHover = defineActionHover("for_each", {
  grammar: "action for_each <trigger_type>",
  params: ["trigger_type"],
});
