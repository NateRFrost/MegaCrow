import { defineActionHover } from "src/language-service/hover/registry";

export const objectSetInvincibilityHover = defineActionHover(
  "object_set_invincibility",
  {
    grammar: "action object_set_invincibility <object> <boolean>",
    params: ["object", "boolean"],
  }
);
