import { defineActionHover } from "src/language-service/hover/registry";

export const randomHover = defineActionHover("random", {
  grammar: "action random <value_count> <number_out (0-count-1)>",
  params: ["value_count", "number_out"],
});
