import { defineElementHover } from "src/language-service/hover/registry";

export const triggerHover = defineElementHover("trigger", {
  grammar: "trigger <name> … end",
});
