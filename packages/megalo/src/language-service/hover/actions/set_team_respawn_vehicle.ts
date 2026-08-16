import { defineActionHover } from "src/language-service/hover/registry";

export const setTeamRespawnVehicleHover = defineActionHover(
  "set_team_respawn_vehicle",
  {
    grammar: "action set_team_respawn_vehicle <vehicle> <team>",
    params: ["vehicle", "team"],
  }
);
