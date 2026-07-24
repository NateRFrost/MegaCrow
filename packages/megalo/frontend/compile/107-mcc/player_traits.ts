import type { c_player_traits } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { getIRValue } from "../../intermediate-representation";
import type { PlayerTraits } from "../../intermediate-representation/game/game_engine_player_traits";
import {
  encodeActiveCamoSetting,
  encodeForcedChangeColorSetting,
  encodeGrenadeCountSetting,
  encodeInfiniteAmmoSetting,
  encodeMotionTrackerSetting,
  encodeVehicleUsageSetting,
  encodeWaypointSetting,
} from "./enums";

/** `damage_resistance invulnerable` encodes to the top of the resistance curve. */
const DAMAGE_RESISTANCE_INVULNERABLE = 12;
/**
 * `damage_modifier fatality` (instant kill). The compiled field stores a raw
 * percentage, so we use the maximum representable percentage as the sentinel.
 * TODO: confirm the exact compiled value the engine expects for "fatality".
 */
const DAMAGE_MODIFIER_FATALITY = 200;

/** Reach `ReadEnumeratedReal` percentage tables (source % -> compiled index). */
const SHIELD_MULTIPLIER_PERCENTAGES = [0, 50, 100, 150, 200, 300, 400];
const SHIELD_RECHARGE_PERCENTAGES = [
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
];
const PLAYER_SPEED_PERCENTAGES = [
  0, 25, 50, 75, 90, 100, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160,
  200,
];

const nearestPercentageIndex = (
  percentages: readonly number[],
  value: number
): number => {
  const exact = percentages.indexOf(value);
  if (exact >= 0) {
    return exact;
  }
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < percentages.length; i++) {
    const distance = Math.abs(percentages[i]! - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
};

const encodeShieldMultiplier = (value: number): number =>
  nearestPercentageIndex(SHIELD_MULTIPLIER_PERCENTAGES, value);

const encodeShieldRecharge = (value: number): number =>
  nearestPercentageIndex(SHIELD_RECHARGE_PERCENTAGES, value);

const encodePlayerSpeed = (value: number): number => {
  const index = nearestPercentageIndex(PLAYER_SPEED_PERCENTAGES, value);
  return index === 0 ? 0 : index + 1;
};

/** Map-override trait blocks store the raw percentage-table index (no +1 bias). */
const encodeMapOverridePlayerSpeed = (value: number): number =>
  nearestPercentageIndex(PLAYER_SPEED_PERCENTAGES, value);

/** On/off toggles encode source `true`/`1` as compiled value `2` in Reach. */
const encodeToggle = (enabled: boolean): number => (enabled ? 2 : 0);

/**
 * Encode a lowered {@link PlayerTraits} block into a BLF {@link c_player_traits}.
 * Only fields that are present in the IR are written; everything else keeps the
 * target's initialized value.
 */
export const encodePlayerTraits = (
  target: c_player_traits,
  traits: PlayerTraits,
  options?: { mapOverrideSpeed?: boolean }
): void => {
  const sv = target.m_shield_vitality_traits;
  const w = target.m_weapon_traits;
  const m = target.m_movement_traits;
  const a = target.m_appearance_traits;
  const s = target.m_sensor_traits;

  const { shieldVitality, weapons, movement, appearance, sensors } = traits;

  const damageResistance = getIRValue(shieldVitality.damageResistancePercentage);
  if (damageResistance !== undefined) {
    sv.m_damage_resistance_percentage_setting =
      damageResistance === "invulnerable"
        ? DAMAGE_RESISTANCE_INVULNERABLE
        : Number(damageResistance);
  }
  const bodyMultiplier = getIRValue(shieldVitality.bodyMultiplierPercentage);
  if (bodyMultiplier !== undefined) {
    sv.m_body_multiplier = bodyMultiplier;
  }
  const bodyRecharge = getIRValue(shieldVitality.bodyRechargeRatePercentage);
  if (bodyRecharge !== undefined) {
    sv.m_body_recharge_rate = bodyRecharge;
  }
  const shieldMultiplier = getIRValue(shieldVitality.shieldMultiplierPercentage);
  if (shieldMultiplier !== undefined) {
    sv.m_shield_multiplier = encodeShieldMultiplier(shieldMultiplier);
  }
  const shieldRecharge = getIRValue(shieldVitality.shieldRechargeRatePercentage);
  if (shieldRecharge !== undefined) {
    sv.m_shield_recharge_rate = encodeShieldRecharge(shieldRecharge);
  }
  const headshotImmunity = getIRValue(shieldVitality.headshotImmunity);
  if (headshotImmunity !== undefined) {
    sv.m_headshot_immunity_setting = headshotImmunity ? 1 : 0;
  }
  const vampirism = getIRValue(shieldVitality.vampirismPercentage);
  if (vampirism !== undefined) {
    sv.m_vampirism_percentage_setting = vampirism;
  }
  const assassinationImmunity = getIRValue(shieldVitality.assasinationImmunity);
  if (assassinationImmunity !== undefined) {
    sv.m_assasination_immunity = assassinationImmunity ? 1 : 0;
  }

  const damageModifier = getIRValue(weapons.damageModifierPercentageSetting);
  if (damageModifier !== undefined) {
    w.m_damage_modifier_percentage_setting =
      damageModifier === "fatality"
        ? DAMAGE_MODIFIER_FATALITY
        : Number(damageModifier);
  }
  const meleeDamageModifier = getIRValue(weapons.meleeDamageModifierPercentageSetting);
  if (meleeDamageModifier !== undefined) {
    w.m_melee_damage_modifier_percentage_setting =
      meleeDamageModifier === "fatality"
        ? DAMAGE_MODIFIER_FATALITY
        : Number(meleeDamageModifier);
  }
  const primaryWeapon = getIRValue(weapons.initialPrimaryWeaponAbsoluteIndex);
  if (primaryWeapon !== undefined) {
    w.m_initial_primary_weapon_absolute_index = primaryWeapon;
  }
  const secondaryWeapon = getIRValue(weapons.initialSecondaryWeaponAbsoluteIndex);
  if (secondaryWeapon !== undefined) {
    w.m_initial_secondary_weapon_absolute_index = secondaryWeapon;
  }
  const initialEquipment = getIRValue(weapons.initialEquipmentAbsoluteIndex);
  if (initialEquipment !== undefined) {
    w.m_initial_equipment_absolute_index = initialEquipment;
  }
  const grenadeCount = getIRValue(weapons.initialGrenadeCount);
  if (grenadeCount !== undefined) {
    w.m_initial_grenade_count_setting = encodeGrenadeCountSetting(grenadeCount);
  }
  const infiniteAmmo = getIRValue(weapons.infiniteAmmo);
  if (infiniteAmmo !== undefined) {
    w.m_infinite_ammo_setting = encodeInfiniteAmmoSetting(infiniteAmmo);
  }
  const rechargingGrenades = getIRValue(weapons.rechargingGrenades);
  if (rechargingGrenades !== undefined) {
    w.m_recharging_grenades_setting = rechargingGrenades ? 1 : 0;
  }
  // `weapon_pickup` is stored inverted in the compiled form (allowed pickup -> 0).
  const weaponPickup = getIRValue(weapons.weaponPickup);
  if (weaponPickup !== undefined) {
    w.m_weapon_pickup_setting = weaponPickup ? 0 : 1;
  }
  const equipmentUsage = getIRValue(weapons.equipmentUsage);
  if (equipmentUsage !== undefined) {
    w.m_equipment_usage_setting = equipmentUsage ? 1 : 0;
  }
  const dropEquipment = getIRValue(weapons.dropEquipment);
  if (dropEquipment !== undefined) {
    w.m_equipment_drop_on_death_setting = dropEquipment ? 1 : 0;
  }
  const infiniteEquipment = getIRValue(weapons.infiniteEquipment);
  if (infiniteEquipment !== undefined) {
    w.m_infinite_equipment_setting = encodeToggle(infiniteEquipment);
  }

  const speed = getIRValue(movement.speedPercentage);
  if (speed !== undefined) {
    m.m_speed_setting = options?.mapOverrideSpeed
      ? encodeMapOverridePlayerSpeed(speed)
      : encodePlayerSpeed(speed);
  }
  const gravity = getIRValue(movement.gravityPercentage);
  if (gravity !== undefined) {
    m.m_gravity_setting = gravity;
  }
  const vehicleUsage = getIRValue(movement.vehicleUsage);
  if (vehicleUsage !== undefined) {
    m.m_vehicle_usage_setting = encodeVehicleUsageSetting(vehicleUsage);
  }
  const jumpModifier = getIRValue(movement.jumpModifier);
  if (jumpModifier !== undefined) {
    m.m_jump_modifier = jumpModifier;
  }

  const activeCamo = getIRValue(appearance.activeCamo);
  if (activeCamo !== undefined) {
    a.m_active_camo_setting = encodeActiveCamoSetting(activeCamo);
  }
  const waypoint = getIRValue(appearance.waypoint);
  if (waypoint !== undefined) {
    a.m_waypoint_setting = encodeWaypointSetting(waypoint);
  }
  const gamertag = getIRValue(appearance.gamertag);
  if (gamertag !== undefined) {
    a.m_gamertag_setting = encodeWaypointSetting(gamertag);
  }
  const forcedChangeColor = getIRValue(appearance.forcedChangeColor);
  if (forcedChangeColor !== undefined) {
    a.m_forced_change_color_setting =
      encodeForcedChangeColorSetting(forcedChangeColor);
  }

  const trackerMode = getIRValue(sensors.motionTrackerMode);
  if (trackerMode !== undefined) {
    s.m_motion_tracker_setting = encodeMotionTrackerSetting(trackerMode);
  }
  const trackerRange = getIRValue(sensors.motionTrackerRange);
  if (trackerRange !== undefined) {
    s.m_motion_tracker_range_setting = trackerRange;
  }
};
