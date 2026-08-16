import { defineActionHover } from "src/language-service/hover/registry";

export const createObjectHover = defineActionHover("create_object", {
  grammar:
    "action create_object <object_type> [at <object>] [set <object_out>] [label <filter>] [offset <x> <y> <z>] [variant <name>] [never_garbage] [suppress_effect] [absolute_orientation]",
  params: ["object_type", "at", "set"],
});
