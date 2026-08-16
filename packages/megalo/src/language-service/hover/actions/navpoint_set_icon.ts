import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetIconHover = defineActionHover("navpoint_set_icon", {
  grammar:
    "action navpoint_set_icon <object> <icon> <number (only if icon==num)>",
  params: ["object", "icon", "number"],
});
