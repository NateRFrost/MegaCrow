import { defineActionHover } from "src/language-service/hover/registry";

export const setRespawnFilterHover = defineActionHover("set_respawn_filter", {
  grammar:
    "action set_respawn_filter <object> {no_one|everyone|allies|enemies|player <player_reference> <boolean>}",
  params: ["object", "audience"],
});
