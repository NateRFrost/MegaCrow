/** Team designators from the Megalo reference model (`none` is the shared empty sentinel). */
export const TEAM_DESIGNATORS = [
  "attackers",
  "defenders",
  "third_party",
  "fourth_party",
  "fifth_party",
  "sixth_party",
  "seventh_party",
  "eighth_party",
] as const;

export type TeamDesignator = (typeof TEAM_DESIGNATORS)[number];

export const isTeamDesignator = (value: string): value is TeamDesignator =>
  (TEAM_DESIGNATORS as readonly string[]).includes(value);
