import { defineActionHover } from "src/language-service/hover/registry";

export const deviceSetPositionTrackHover = defineActionHover(
  "device_set_position_track",
  {
    grammar:
      "action device_set_position_track <object> <animation name> <interpolation time>",
    params: ["object", "animation_name", "interpolation_time"],
  }
);
