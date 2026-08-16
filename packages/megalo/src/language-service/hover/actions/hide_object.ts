import { defineActionHover } from "src/language-service/hover/registry";

export const hideObjectHover = defineActionHover("hide_object", {
  grammar: "action hide_object <object> <should hide>",
  params: ["object", "should_hide"],
});
