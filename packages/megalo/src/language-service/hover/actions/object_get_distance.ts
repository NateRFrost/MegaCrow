import { defineActionHover } from "src/language-service/hover/registry";

export const objectGetDistanceHover = defineActionHover("object_get_distance", {
  grammar:
    "action object_get_distance <object_a> <object_b> <distance_out (feet)>",
  params: ["object_a", "object_b", "distance_out"],
});
