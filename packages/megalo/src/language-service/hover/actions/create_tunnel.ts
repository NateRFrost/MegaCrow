import { defineActionHover } from "src/language-service/hover/registry";

export const createTunnelHover = defineActionHover("create_tunnel", {
  grammar:
    "action create_tunnel <object_a> <object_b> <object_type> <radius> <object_reference_out>",
  params: [
    "object_a",
    "object_b",
    "object_type",
    "radius",
    "object_reference_out",
  ],
});
