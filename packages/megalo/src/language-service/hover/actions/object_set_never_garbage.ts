import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetNeverGarbageHover = defineActionHover(
  "object_set_never_garbage",
  {
    grammar: "action object_set_never_garbage <object> <boolean>",
    params: ["object", "boolean"],
  }
);
