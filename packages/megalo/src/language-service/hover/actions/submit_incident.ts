import { defineActionHover } from "src/language-service/hover/registry";

export const submitIncidentHover = defineActionHover("submit_incident", {
  grammar:
    "action submit_incident <incident_name> <cause_team_or_player> <effect_team_or_player>",
  params: ["incident_name", "cause_team_or_player", "effect_team_or_player"],
});
