import { defineActionHover } from "src/language-service/hover/registry";

export const hsFunctionCallHover = defineActionHover("hs_function_call", {
  grammar: "action hs_function_call <function name>",
  params: ["function_name"],
});
