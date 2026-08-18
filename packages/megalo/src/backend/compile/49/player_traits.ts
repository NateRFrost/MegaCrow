import type { c_player_traits } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import {
  encodeActiveCamoSetting,
  encodeBooleanTrait,
  encodeDamageModifierPercentage,
  encodeDamageResistancePercentage,
  encodeDoubleJumpSetting,
  encodeForcedChangeColorSetting,
  encodeGrenadeCountSetting,
  encodeInfiniteAmmoSetting,
  encodeMotionTrackerRange,
  encodeMotionTrackerSetting,
  encodePlayerGravityPercentage,
  encodePlayerSpeedPercentage,
  encodeRechargeRatePercentage,
  encodeShieldMultiplierPercentage,
  encodeVampirismPercentage,
  encodeVehicleUsageSetting,
  encodeWaypointSetting,
} from "src/backend/compile/49/enums";
import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";

/**
 * Encode a lowered {@link PlayerTraits} block into Alpha {@link c_player_traits}.
 * Only fields present in the IR are written; everything else keeps the target's
 * initialized value. Alpha layout has no body multiplier / deathless, and
 * equipment usage / sprint live on movement.
 */
export const encodePlayerTraits = (
  target: c_player_traits,
  traits: PlayerTraits
): void => {
  const shieldVitalityTraits = target.m_shield_vitality_traits;
  const weaponTraits = target.m_weapon_traits;
  const movementTraits = target.m_movement_traits;
  const appearanceTraits = target.m_appearance_traits;
  const sensorTraits = target.m_sensor_traits;

  const { shieldVitality, weapons, movement, appearance, sensors } = traits;

  if (shieldVitality.damageResistancePercentage !== undefined) {
    shieldVitalityTraits.m_damage_resistance_percentage_setting =
      encodeDamageResistancePercentage(
        shieldVitality.damageResistancePercentage
      );
  }
  if (shieldVitality.shieldMultiplierPercentage !== undefined) {
    shieldVitalityTraits.m_shield_multiplier = encodeShieldMultiplierPercentage(
      shieldVitality.shieldMultiplierPercentage
    );
  }
  if (shieldVitality.shieldRechargeRatePercentage !== undefined) {
    shieldVitalityTraits.m_shield_recharge_rate = encodeRechargeRatePercentage(
      shieldVitality.shieldRechargeRatePercentage
    );
  }
  if (shieldVitality.headshotImmunity !== undefined) {
    shieldVitalityTraits.m_headshot_immunity_setting = encodeBooleanTrait(
      shieldVitality.headshotImmunity
    );
  }
  if (shieldVitality.vampirismPercentage !== undefined) {
    shieldVitalityTraits.m_vampirism_percentage_setting =
      encodeVampirismPercentage(shieldVitality.vampirismPercentage);
  }
  if (shieldVitality.assasinationImmunity !== undefined) {
    shieldVitalityTraits.m_assasination_immunity = encodeBooleanTrait(
      shieldVitality.assasinationImmunity
    );
  }

  if (weapons.damageModifierPercentageSetting !== undefined) {
    weaponTraits.m_damage_modifier_percentage_setting =
      encodeDamageModifierPercentage(weapons.damageModifierPercentageSetting);
  }
  if (weapons.meleeDamageModifierPercentageSetting !== undefined) {
    weaponTraits.m_melee_damage_modifier_percentage_setting =
      encodeDamageModifierPercentage(
        weapons.meleeDamageModifierPercentageSetting
      );
  }
  if (weapons.initialPrimaryWeaponAbsoluteIndex !== undefined) {
    weaponTraits.m_initial_primary_weapon_absolute_index =
      weapons.initialPrimaryWeaponAbsoluteIndex;
  }
  if (weapons.initialSecondaryWeaponAbsoluteIndex !== undefined) {
    weaponTraits.m_initial_secondary_weapon_absolute_index =
      weapons.initialSecondaryWeaponAbsoluteIndex;
  }
  if (weapons.initialEquipmentAbsoluteIndex !== undefined) {
    weaponTraits.m_initial_equipment_absolute_index =
      weapons.initialEquipmentAbsoluteIndex;
  }
  if (weapons.initialGrenadeCount !== undefined) {
    weaponTraits.m_initial_grenade_count_setting = encodeGrenadeCountSetting(
      weapons.initialGrenadeCount
    );
  }
  if (weapons.infiniteAmmo !== undefined) {
    weaponTraits.m_infinite_ammo_setting = encodeInfiniteAmmoSetting(
      weapons.infiniteAmmo
    );
  }
  if (weapons.rechargingGrenades !== undefined) {
    weaponTraits.m_recharging_grenades_setting = encodeBooleanTrait(
      weapons.rechargingGrenades
    );
  }
  if (weapons.weaponPickup !== undefined) {
    weaponTraits.m_weapon_pickup_setting = encodeBooleanTrait(
      weapons.weaponPickup
    );
  }
  if (weapons.dropEquipment !== undefined) {
    weaponTraits.m_equipment_drop_on_death_setting = encodeBooleanTrait(
      weapons.dropEquipment
    );
  }
  if (weapons.infiniteEquipment !== undefined) {
    weaponTraits.m_infinite_equipment_setting = encodeBooleanTrait(
      weapons.infiniteEquipment
    );
  }
  // Alpha stores equipment usage on movement (not weapons).
  if (weapons.equipmentUsage !== undefined) {
    movementTraits.m_equipment_usage_setting = encodeBooleanTrait(
      weapons.equipmentUsage
    );
  }

  if (movement.speedPercentage !== undefined) {
    movementTraits.m_speed_setting = encodePlayerSpeedPercentage(
      movement.speedPercentage
    );
  }
  if (movement.gravityPercentage !== undefined) {
    movementTraits.m_gravity_setting = encodePlayerGravityPercentage(
      movement.gravityPercentage
    );
  }
  if (movement.vehicleUsage !== undefined) {
    movementTraits.m_vehicle_usage_setting = encodeVehicleUsageSetting(
      movement.vehicleUsage
    );
  }
  if (movement.sprinting !== undefined) {
    movementTraits.m_sprint_setting = encodeBooleanTrait(movement.sprinting);
  }
  if (movement.doubleJump !== undefined) {
    movementTraits.m_double_jump_setting = encodeDoubleJumpSetting(
      movement.doubleJump
    );
  }
  if (movement.jumpModifier !== undefined) {
    // Alpha jump modifier is a quantized real in [0, 4]; IR is a percentage.
    movementTraits.m_jump_modifier = movement.jumpModifier / 100;
  }

  if (appearance.activeCamo !== undefined) {
    appearanceTraits.m_active_camo_setting = encodeActiveCamoSetting(
      appearance.activeCamo
    );
  }
  if (appearance.waypoint !== undefined) {
    appearanceTraits.m_waypoint_setting = encodeWaypointSetting(
      appearance.waypoint
    );
  }
  if (appearance.gamertag !== undefined) {
    appearanceTraits.m_gamertag_setting = encodeWaypointSetting(
      appearance.gamertag
    );
  }
  if (appearance.forcedChangeColor !== undefined) {
    appearanceTraits.m_forced_change_color_setting =
      encodeForcedChangeColorSetting(appearance.forcedChangeColor);
  }

  if (sensors.motionTrackerMode !== undefined) {
    sensorTraits.m_motion_tracker_setting = encodeMotionTrackerSetting(
      sensors.motionTrackerMode
    );
  }
  if (sensors.motionTrackerRange !== undefined) {
    sensorTraits.m_motion_tracker_range_setting = encodeMotionTrackerRange(
      sensors.motionTrackerRange
    );
  }
};
