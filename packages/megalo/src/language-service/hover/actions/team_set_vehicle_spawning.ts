import { defineActionHover } from "src/language-service/hover/registry";

export const teamSetVehicleSpawningHover = defineActionHover(
  "team_set_vehicle_spawning",
  {
    grammar: "action team_set_vehicle_spawning <team> <literal_boolean>",
    params: ["team", "literal_boolean"],
  }
);
