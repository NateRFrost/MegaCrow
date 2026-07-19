/** Built-in override options whose value is a nested player_traits body. */
export const PLAYER_TRAITS_OVERRIDE_OPTIONS = [
  "base_player_traits",
  "respawn_traits",
  "red_powerup_traits",
  "blue_powerup_traits",
  "yellow_powerup_traits",
] as const;

export type PlayerTraitsOverrideOption =
  (typeof PLAYER_TRAITS_OVERRIDE_OPTIONS)[number];

export const isPlayerTraitsOverrideOption = (
  value: string
): value is PlayerTraitsOverrideOption =>
  (PLAYER_TRAITS_OVERRIDE_OPTIONS as readonly string[]).includes(value);
