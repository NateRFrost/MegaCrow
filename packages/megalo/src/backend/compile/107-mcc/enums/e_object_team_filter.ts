import { e_object_team_filter } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ObjectTeamFilter } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";

export const encodeObjectTeamFilter = (
  value: ObjectTeamFilter
): e_object_team_filter => {
  switch (value) {
    case ObjectTeamFilter.None:
      return e_object_team_filter.none;
    case ObjectTeamFilter.Team1:
      return e_object_team_filter.team_1;
    case ObjectTeamFilter.Team2:
      return e_object_team_filter.team_2;
    case ObjectTeamFilter.Team3:
      return e_object_team_filter.team_3;
    case ObjectTeamFilter.Team4:
      return e_object_team_filter.team_4;
    case ObjectTeamFilter.Team5:
      return e_object_team_filter.team_5;
    case ObjectTeamFilter.Team6:
      return e_object_team_filter.team_6;
    case ObjectTeamFilter.Team7:
      return e_object_team_filter.team_7;
    case ObjectTeamFilter.Team8:
      return e_object_team_filter.team_8;
    case ObjectTeamFilter.Neutral:
      return e_object_team_filter.neutral;
    case ObjectTeamFilter.Each:
      return e_object_team_filter.each;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
