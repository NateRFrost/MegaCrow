import { defineKeywordHover } from "src/language-service/hover/registry";
import type { HoverContribution } from "src/language-service/hover/types";

export const keywordHovers: readonly HoverContribution[] = [
  defineKeywordHover("action", {
    grammar: "action <name> …",
  }),
  defineKeywordHover("condition", {
    grammar: "condition [not] <name> …",
  }),
  defineKeywordHover("temporary", {
    grammar: "temporary <storage> <name> <initial>",
  }),
  defineKeywordHover("begin", {
    grammar: "begin … end",
  }),
  defineKeywordHover("end", {
    grammar: "end",
  }),
  defineKeywordHover("not", {
    grammar: "condition not <name> …",
  }),
];
