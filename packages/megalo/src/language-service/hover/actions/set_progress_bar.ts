import { defineActionHover } from "src/language-service/hover/registry";

export const setProgressBarHover = defineActionHover("set_progress_bar", {
  grammar:
    "action set_progress_bar <object> {no_one|everyone|allies|enemies|player <player_reference> <boolean>} <timer_name>",
  params: ["object", "audience", "timer_name"],
});
