import { defineActionHover } from "src/language-service/hover/registry";

export const endRoundHover = defineActionHover("end_round", {
  grammar: "action end_round",
});
