import { defineActionHover } from "src/language-service/hover/registry";

export const breakIntoDebuggerHover = defineActionHover("break_into_debugger", {
  grammar: "action break_into_debugger",
});
