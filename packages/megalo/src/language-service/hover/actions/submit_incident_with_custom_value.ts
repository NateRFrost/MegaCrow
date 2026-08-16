import { defineActionHover } from "src/language-service/hover/registry";

export const submitIncidentWithCustomValueHover = defineActionHover(
  "submit_incident_with_custom_value",
  {
    grammar:
      "action submit_incident_with_custom_value <incident_name> <cause_team_or_player> <effect_team_or_player> <custom_value_such_as_territory_index>",
    params: [
      "incident_name",
      "cause_team_or_player",
      "effect_team_or_player",
      "custom_value_such_as_territory_index",
    ],
  }
);
