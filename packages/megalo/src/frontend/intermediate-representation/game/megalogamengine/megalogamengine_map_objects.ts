import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";
import { megaloEnum, type MegaloEnumNames } from "src/frontend/intermediate-representation/megaloEnum";

/** Same vocabulary as team designators, plus `each`. */
export const objectTeamFilter = megaloEnum([
  "none",
  "defenders",
  "attackers",
  "third_party",
  "fourth_party",
  "fifth_party",
  "sixth_party",
  "seventh_party",
  "eighth_party",
  "neutral",
  "each",
] as const);
export const ObjectTeamFilter = objectTeamFilter.enum;
export type ObjectTeamFilter = MegaloEnumNames<typeof objectTeamFilter>;

export type ObjectFilter = Partial<{
  label: StringTableReference;
  objectType: number; // object_lists/objects.txt
  team: ObjectTeamFilter;
  userData: number;
  min: number;
}>;
