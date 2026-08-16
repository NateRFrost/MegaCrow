import { defineActionHover } from "src/language-service/hover/registry";

export const deviceAnimatePositionHover = defineActionHover(
  "device_animate_position",
  {
    grammar:
      "action device_animate_position <object> <animation_target_fraction> <animation_duration_seconds> <acceleration_seconds> <deceleration_seconds>",
    params: [
      "object",
      "animation_target_fraction",
      "animation_duration_seconds",
      "acceleration_seconds",
      "deceleration_seconds",
    ],
  }
);
