import { defineElementHover } from "src/language-service/hover/registry";

export const variablesHover = defineElementHover("variables", {
  grammar: "variables {global|player|team|object} … end",
});
