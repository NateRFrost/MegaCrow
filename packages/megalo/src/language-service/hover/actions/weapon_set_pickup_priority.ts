import { defineActionHover } from "src/language-service/hover/registry";

export const weaponSetPickupPriorityHover = defineActionHover(
  "weapon_set_pickup_priority",
  {
    grammar: "action weapon_set_pickup_priority <object> {normal|special|auto}",
    params: ["object", "priority"],
  }
);
