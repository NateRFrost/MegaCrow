import { defineActionHover } from "src/language-service/hover/registry";

export const playerGetVehicleHover = defineActionHover("player_get_vehicle", {
  grammar: "action player_get_vehicle <player> <vehicle_out>",
  params: ["player", "vehicle_out"],
});
