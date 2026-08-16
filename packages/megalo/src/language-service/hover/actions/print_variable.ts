import { defineActionHover } from "src/language-service/hover/registry";

export const printVariableHover = defineActionHover("print_variable", {
  grammar: "action print_variable <dynamic_string>",
  params: ["dynamic_string"],
});
