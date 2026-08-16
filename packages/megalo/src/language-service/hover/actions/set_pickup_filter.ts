import { defineActionHover } from "src/language-service/hover/registry";

export const setPickupFilterHover = defineActionHover("set_pickup_filter", {
  grammar:
    "action set_pickup_filter <object> {no_one|everyone|allies|enemies|player <player_reference> <boolean>}",
  params: ["object", "audience"],
});
