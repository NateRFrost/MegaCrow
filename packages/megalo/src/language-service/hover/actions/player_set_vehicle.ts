import { defineActionHover } from "src/language-service/hover/registry";

export const playerSetVehicleHover = defineActionHover("player_set_vehicle", {
  grammar: "action player_set_vehicle <player> <vehicle>",
  params: ["player", "vehicle"],
});
