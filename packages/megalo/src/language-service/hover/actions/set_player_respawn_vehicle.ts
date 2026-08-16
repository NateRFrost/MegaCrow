import { defineActionHover } from "src/language-service/hover/registry";

export const setPlayerRespawnVehicleHover = defineActionHover(
  "set_player_respawn_vehicle",
  {
    grammar: "action set_player_respawn_vehicle <vehicle> <player>",
    params: ["vehicle", "player"],
  }
);
