import { defineActionHover } from "src/language-service/hover/registry";

export const objectGetVelocityHover = defineActionHover("object_get_velocity", {
  grammar: "action object_get_velocity <object> <number_out (ft/s)>",
  params: ["object", "number_out"],
});
