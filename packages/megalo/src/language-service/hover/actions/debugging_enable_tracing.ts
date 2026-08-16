import { defineActionHover } from "src/language-service/hover/registry";

export const debuggingEnableTracingHover = defineActionHover(
  "debugging_enable_tracing",
  {
    grammar: "action debugging_enable_tracing <literal_boolean>",
    params: ["literal_boolean"],
  }
);
