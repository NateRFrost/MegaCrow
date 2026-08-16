import {
  e_body_multiplier_setting,
  e_damage_modifier_percentage_setting,
  e_damage_resistance_percentage_setting,
  e_motion_tracker_range_setting,
  e_player_gravity_setting,
  e_player_speed_setting,
  e_recharge_rate_percentage_setting,
  e_shield_multiplier_setting,
  e_vampirism_percentage_setting,
} from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";

interface EnumeratedRealOption<T> {
  setting: T;
  /** Script / IR numeric value (percent or meters). */
  value: number;
}

const nearestEnumeratedReal = <T>(
  options: readonly EnumeratedRealOption<T>[],
  value: number
): T => {
  const exact = options.find((option) => option.value === value);
  if (exact !== undefined) {
    return exact.setting;
  }
  let best = options[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const distance = Math.abs(option.value - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = option;
    }
  }
  return best.setting;
};

/** Reach `s_damage_resistance_option_metadata` (skips unchanged `-1`). */
const DAMAGE_RESISTANCE: readonly EnumeratedRealOption<e_damage_resistance_percentage_setting>[] =
  [
    { value: 10, setting: e_damage_resistance_percentage_setting.percent_10 },
    { value: 50, setting: e_damage_resistance_percentage_setting.percent_50 },
    { value: 90, setting: e_damage_resistance_percentage_setting.percent_90 },
    { value: 100, setting: e_damage_resistance_percentage_setting.percent_100 },
    { value: 110, setting: e_damage_resistance_percentage_setting.percent_110 },
    { value: 150, setting: e_damage_resistance_percentage_setting.percent_150 },
    { value: 200, setting: e_damage_resistance_percentage_setting.percent_200 },
    { value: 300, setting: e_damage_resistance_percentage_setting.percent_300 },
    { value: 500, setting: e_damage_resistance_percentage_setting.percent_500 },
    {
      value: 1000,
      setting: e_damage_resistance_percentage_setting.percent_1000,
    },
    {
      value: 2000,
      setting: e_damage_resistance_percentage_setting.percent_2000,
    },
  ];

/** Reach `s_damage_modifier_option_metadata` (skips unchanged `-1`). */
const DAMAGE_MODIFIER: readonly EnumeratedRealOption<e_damage_modifier_percentage_setting>[] =
  [
    { value: 0, setting: e_damage_modifier_percentage_setting.percent_0 },
    { value: 25, setting: e_damage_modifier_percentage_setting.percent_25 },
    { value: 50, setting: e_damage_modifier_percentage_setting.percent_50 },
    { value: 75, setting: e_damage_modifier_percentage_setting.percent_75 },
    { value: 90, setting: e_damage_modifier_percentage_setting.percent_90 },
    { value: 100, setting: e_damage_modifier_percentage_setting.percent_100 },
    { value: 110, setting: e_damage_modifier_percentage_setting.percent_110 },
    { value: 125, setting: e_damage_modifier_percentage_setting.percent_125 },
    { value: 150, setting: e_damage_modifier_percentage_setting.percent_150 },
    { value: 200, setting: e_damage_modifier_percentage_setting.percent_200 },
    { value: 300, setting: e_damage_modifier_percentage_setting.percent_300 },
    { value: 1000, setting: e_damage_modifier_percentage_setting.fatality },
  ];

/** Reach `s_shield_multiplier_option_metadata` (skips unchanged `-1`). */
const SHIELD_MULTIPLIER: readonly EnumeratedRealOption<e_shield_multiplier_setting>[] =
  [
    { value: 0, setting: e_shield_multiplier_setting.percent_0 },
    { value: 100, setting: e_shield_multiplier_setting.percent_100 },
    { value: 150, setting: e_shield_multiplier_setting.percent_150 },
    { value: 200, setting: e_shield_multiplier_setting.percent_200 },
    { value: 300, setting: e_shield_multiplier_setting.percent_300 },
    { value: 400, setting: e_shield_multiplier_setting.percent_400 },
  ];

/** Reach `s_body_multiplier_option_metadata` (skips unchanged `-1`). */
const BODY_MULTIPLIER: readonly EnumeratedRealOption<e_body_multiplier_setting>[] =
  [
    { value: 0, setting: e_body_multiplier_setting.percent_0 },
    { value: 100, setting: e_body_multiplier_setting.percent_100 },
    { value: 150, setting: e_body_multiplier_setting.percent_150 },
    { value: 200, setting: e_body_multiplier_setting.percent_200 },
    { value: 300, setting: e_body_multiplier_setting.percent_300 },
    { value: 400, setting: e_body_multiplier_setting.percent_400 },
  ];

/** Reach shield/body recharge metadata (skips unchanged `-1`). */
const RECHARGE_RATE: readonly EnumeratedRealOption<e_recharge_rate_percentage_setting>[] =
  [
    {
      value: -25,
      setting: e_recharge_rate_percentage_setting.percent_negative_25,
    },
    {
      value: -10,
      setting: e_recharge_rate_percentage_setting.percent_negative_10,
    },
    {
      value: -5,
      setting: e_recharge_rate_percentage_setting.percent_negative_5,
    },
    { value: 0, setting: e_recharge_rate_percentage_setting.percent_0 },
    { value: 10, setting: e_recharge_rate_percentage_setting.percent_10 },
    { value: 25, setting: e_recharge_rate_percentage_setting.percent_25 },
    { value: 50, setting: e_recharge_rate_percentage_setting.percent_50 },
    { value: 75, setting: e_recharge_rate_percentage_setting.percent_75 },
    { value: 90, setting: e_recharge_rate_percentage_setting.percent_90 },
    { value: 100, setting: e_recharge_rate_percentage_setting.percent_100 },
    { value: 110, setting: e_recharge_rate_percentage_setting.percent_110 },
    { value: 125, setting: e_recharge_rate_percentage_setting.percent_125 },
    { value: 150, setting: e_recharge_rate_percentage_setting.percent_150 },
    { value: 200, setting: e_recharge_rate_percentage_setting.percent_200 },
  ];

/** Reach `s_vampirism_option_metadata` (skips unchanged `-1`). */
const VAMPIRISM: readonly EnumeratedRealOption<e_vampirism_percentage_setting>[] =
  [
    { value: 0, setting: e_vampirism_percentage_setting.percent_0 },
    { value: 10, setting: e_vampirism_percentage_setting.percent_10 },
    { value: 25, setting: e_vampirism_percentage_setting.percent_25 },
    { value: 50, setting: e_vampirism_percentage_setting.percent_50 },
    { value: 100, setting: e_vampirism_percentage_setting.percent_100 },
  ];

/** Reach `s_player_speed_option_metadata` (skips unchanged `-1`). */
const PLAYER_SPEED: readonly EnumeratedRealOption<e_player_speed_setting>[] = [
  { value: 0, setting: e_player_speed_setting.percent_0 },
  { value: 25, setting: e_player_speed_setting.percent_25 },
  { value: 50, setting: e_player_speed_setting.percent_50 },
  { value: 75, setting: e_player_speed_setting.percent_75 },
  { value: 90, setting: e_player_speed_setting.percent_90 },
  { value: 100, setting: e_player_speed_setting.percent_100 },
  { value: 110, setting: e_player_speed_setting.percent_110 },
  { value: 120, setting: e_player_speed_setting.percent_120 },
  { value: 130, setting: e_player_speed_setting.percent_130 },
  { value: 140, setting: e_player_speed_setting.percent_140 },
  { value: 150, setting: e_player_speed_setting.percent_150 },
  { value: 160, setting: e_player_speed_setting.percent_160 },
  { value: 170, setting: e_player_speed_setting.percent_170 },
  { value: 180, setting: e_player_speed_setting.percent_180 },
  { value: 190, setting: e_player_speed_setting.percent_190 },
  { value: 200, setting: e_player_speed_setting.percent_200 },
  { value: 300, setting: e_player_speed_setting.percent_300 },
];

/** Reach `s_player_gravity_option_metadata` (skips unchanged `-1`). */
const PLAYER_GRAVITY: readonly EnumeratedRealOption<e_player_gravity_setting>[] =
  [
    { value: 50, setting: e_player_gravity_setting.percent_50 },
    { value: 75, setting: e_player_gravity_setting.percent_75 },
    { value: 100, setting: e_player_gravity_setting.percent_100 },
    { value: 110, setting: e_player_gravity_setting.percent_110 },
    { value: 120, setting: e_player_gravity_setting.percent_120 },
    { value: 130, setting: e_player_gravity_setting.percent_130 },
    { value: 140, setting: e_player_gravity_setting.percent_140 },
    { value: 150, setting: e_player_gravity_setting.percent_150 },
    { value: 160, setting: e_player_gravity_setting.percent_160 },
    { value: 170, setting: e_player_gravity_setting.percent_170 },
    { value: 180, setting: e_player_gravity_setting.percent_180 },
    { value: 190, setting: e_player_gravity_setting.percent_190 },
    { value: 200, setting: e_player_gravity_setting.percent_200 },
  ];

/** Reach `s_motion_tracker_range_option_metadata` (skips unchanged `-1`). */
const MOTION_TRACKER_RANGE: readonly EnumeratedRealOption<e_motion_tracker_range_setting>[] =
  [
    { value: 10, setting: e_motion_tracker_range_setting.meters_10 },
    { value: 15, setting: e_motion_tracker_range_setting.meters_15 },
    { value: 25, setting: e_motion_tracker_range_setting.meters_25 },
    { value: 50, setting: e_motion_tracker_range_setting.meters_50 },
    { value: 75, setting: e_motion_tracker_range_setting.meters_75 },
    { value: 100, setting: e_motion_tracker_range_setting.meters_100 },
    { value: 150, setting: e_motion_tracker_range_setting.meters_150 },
  ];

export const encodeDamageResistancePercentage = (
  value: "invulnerable" | number
): e_damage_resistance_percentage_setting => {
  if (value === "invulnerable") {
    return e_damage_resistance_percentage_setting.invulnerable;
  }
  return nearestEnumeratedReal(DAMAGE_RESISTANCE, value);
};

export const encodeDamageModifierPercentage = (
  value: "fatality" | number
): e_damage_modifier_percentage_setting => {
  if (value === "fatality") {
    return e_damage_modifier_percentage_setting.fatality;
  }
  return nearestEnumeratedReal(DAMAGE_MODIFIER, value);
};

export const encodeShieldMultiplierPercentage = (
  value: number
): e_shield_multiplier_setting =>
  nearestEnumeratedReal(SHIELD_MULTIPLIER, value);

export const encodeBodyMultiplierPercentage = (
  value: number
): e_body_multiplier_setting => nearestEnumeratedReal(BODY_MULTIPLIER, value);

export const encodeRechargeRatePercentage = (
  value: number
): e_recharge_rate_percentage_setting =>
  nearestEnumeratedReal(RECHARGE_RATE, value);

export const encodeVampirismPercentage = (
  value: number
): e_vampirism_percentage_setting => nearestEnumeratedReal(VAMPIRISM, value);

export const encodePlayerSpeedPercentage = (
  value: number
): e_player_speed_setting => nearestEnumeratedReal(PLAYER_SPEED, value);

export const encodePlayerGravityPercentage = (
  value: number
): e_player_gravity_setting => nearestEnumeratedReal(PLAYER_GRAVITY, value);

export const encodeMotionTrackerRange = (
  value: number
): e_motion_tracker_range_setting =>
  nearestEnumeratedReal(MOTION_TRACKER_RANGE, value);
