import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetVehicleSpawningHover = defineActionHover(
  "player_set_vehicle_spawning",
  {
    grammar: "action player_set_vehicle_spawning <player> <literal_boolean>",
    params: ["player", "literal_boolean"],
  }
);
