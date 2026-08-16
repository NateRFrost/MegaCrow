import { defineActionHover } from "src/language-service/hover/registry";

export const getRandomObjectHover = defineActionHover("get_random_object", {
  grammar:
    "action get_random_object <filter name> <ignore object> <object out>",
  params: ["filter_name", "ignore_object", "object_out"],
});
