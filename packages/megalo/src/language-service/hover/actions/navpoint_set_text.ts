import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetTextHover = defineActionHover("navpoint_set_text", {
  grammar: "action navpoint_set_text <object> <dynamic_string>",
  params: ["object", "dynamic_string"],
});
