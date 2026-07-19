import type { ValueWithLocation } from "..";

/** Script percentage, or `invulnerable` (wire setting chosen at compile). */
export type DamageResistance = "invulnerable" | number;
/** Script percentage, or `fatality` (wire value chosen at compile). */
export type DamageModifier = "fatality" | number;

export type PlayerTraitShieldVitality = Partial<{
  damageResistancePercentage: ValueWithLocation<DamageResistance>;
  bodyMultiplierPercentage: ValueWithLocation<number>;
  bodyRechargeRatePercentage: ValueWithLocation<number>;
  shieldMultiplierPercentage: ValueWithLocation<number>;
  shieldRechargeRatePercentage: ValueWithLocation<number>;
  headshotImmunity: ValueWithLocation<boolean>;
  vampirismPercentage: ValueWithLocation<number>;
  assasinationImmunity: ValueWithLocation<boolean>;
  deathless: ValueWithLocation<boolean>;
}>;

export enum GrenadeCountSetting {
  None = 0,
  Default = 1,
  Zero = 2,
  Frag1 = 3,
  Frag2 = 4,
  Frag3 = 5,
  Frag4 = 6,
  Plasma1 = 7,
  Plasma2 = 8,
  Plasma3 = 9,
  Plasma4 = 10,
  Each1 = 11,
  Each2 = 12,
  Each3 = 13,
  Each4 = 14,
}

export enum InfiniteAmmoSetting {
  Unchanged = 0,
  Disabled = 1,
  Enabled = 2,
  BottomlessClip = 3,
}

export type PlayerTraitWeapons = Partial<{
  damageModifierPercentageSetting: ValueWithLocation<DamageModifier>;
  meleeDamageModifierPercentageSetting: ValueWithLocation<DamageModifier>;
  initialPrimaryWeaponAbsoluteIndex: ValueWithLocation<number>; // object_lists/weapons.txt
  initialSecondaryWeaponAbsoluteIndex: ValueWithLocation<number>; // object_lists/weapons.txt
  initialGrenadeCount: ValueWithLocation<GrenadeCountSetting>;
  rechargingGrenades: ValueWithLocation<boolean>;
  infiniteAmmo: ValueWithLocation<InfiniteAmmoSetting>;
  weaponPickup: ValueWithLocation<boolean>;
  equipmentUsage: ValueWithLocation<boolean>;
  dropEquipment: ValueWithLocation<boolean>;
  infiniteEquipment: ValueWithLocation<boolean>;
  initialEquipmentAbsoluteIndex: ValueWithLocation<number>; // object_lists/equipment.txt
}>;

export enum VehicleUsage {
  Unchanged = 0,
  None = 1,
  Full = 2,
  Passenger = 3,
  NotPassenger = 4,
  Driver = 5,
  Gunner = 6,
  NotDriver = 7,
  NotGunner = 8,
}

export type PlayerTraitMovement = Partial<{
  speedPercentage: ValueWithLocation<number>;
  gravityPercentage: ValueWithLocation<number>;
  vehicleUsage: ValueWithLocation<VehicleUsage>;
  jumpModifier: ValueWithLocation<number>; // % expressed as an integer
  /** Reach ≤73 wire field; absence means unchanged. */
  sprinting: ValueWithLocation<boolean>;
}>;

export enum ActiveCamo {
  Off = 0,
  On = 1,
  Poor = 2,
  Good = 3,
  Excellent = 4,
  Invisible = 5,
}

export enum WaypointVisibility {
  Unchanged = 0,
  Off = 1,
  Allies = 2,
  All = 3,
}

export enum ForcedChangeColor {
  Unchanged = 0,
  Off = 1,
  Red = 2,
  Blue = 3,
  Green = 4,
  Yellow = 5,
  Purple = 6,
  Orange = 7,
  Brown = 8,
  Pink = 9,
  White = 10,
  Black = 11,
  Zombie = 12,
  Extra4 = 13,
}

export type PlayerTraitAppearance = Partial<{
  activeCamo: ValueWithLocation<ActiveCamo>;
  waypoint: ValueWithLocation<WaypointVisibility>;
  gamertag: ValueWithLocation<WaypointVisibility>;
  forcedChangeColor: ValueWithLocation<ForcedChangeColor>;
}>;

export enum MotionTrackerMode {
  Unchanged = 0,
  Off = 1,
  Allies = 2,
  Normal = 3,
  Enhanced = 4,
}

export type PlayerTraitSensors = Partial<{
  motionTrackerMode: ValueWithLocation<MotionTrackerMode>;
  motionTrackerRange: ValueWithLocation<number>;
}>;

export type PlayerTraits = {
  shieldVitality: PlayerTraitShieldVitality;
  weapons: PlayerTraitWeapons;
  movement: PlayerTraitMovement;
  appearance: PlayerTraitAppearance;
  sensors: PlayerTraitSensors;
};
