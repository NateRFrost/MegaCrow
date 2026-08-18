import { e_object_team_filter } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import {
  ObjectTeamFilter,
  type ObjectTeamFilter as ObjectTeamFilterName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const OBJECT_TEAM_FILTER_TO_BLF = {
  [ObjectTeamFilter.none]: e_object_team_filter.none,
  [ObjectTeamFilter.defenders]: e_object_team_filter.defenders,
  [ObjectTeamFilter.attackers]: e_object_team_filter.attackers,
  [ObjectTeamFilter.third_party]: e_object_team_filter.third_party,
  [ObjectTeamFilter.fourth_party]: e_object_team_filter.fourth_party,
  [ObjectTeamFilter.fifth_party]: e_object_team_filter.fifth_party,
  [ObjectTeamFilter.sixth_party]: e_object_team_filter.sixth_party,
  [ObjectTeamFilter.seventh_party]: e_object_team_filter.seventh_party,
  [ObjectTeamFilter.eighth_party]: e_object_team_filter.eighth_party,
  [ObjectTeamFilter.neutral]: e_object_team_filter.neutral,
  [ObjectTeamFilter.each]: e_object_team_filter.each,
} as const satisfies Record<ObjectTeamFilterName, e_object_team_filter>;

export const encodeObjectTeamFilter = (
  value: ObjectTeamFilterName
): e_object_team_filter => mapMegaloEnum(value, OBJECT_TEAM_FILTER_TO_BLF);
