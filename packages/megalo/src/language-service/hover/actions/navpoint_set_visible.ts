import { defineActionHover } from "src/language-service/hover/registry";

export const navpointSetVisibleHover = defineActionHover(
  "navpoint_set_visible",
  {
    grammar:
      "action navpoint_set_visible <object> {no_one|everyone|allies|enemies|player <player_reference> <boolean>}",
    params: ["object", "audience"],
  }
);
