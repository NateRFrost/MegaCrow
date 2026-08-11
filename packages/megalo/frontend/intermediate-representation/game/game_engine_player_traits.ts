
export type DamageResistance = "invulnerable" | number;
export type DamageModifier = "fatality" | number;

export type PlayerTraitShieldVitality = Partial<{
  damageResistancePercentage: DamageResistance;
  bodyMultiplierPercentage: number;
  bodyRechargeRatePercentage: number;
  shieldMultiplierPercentage: number;
  shieldRechargeRatePercentage: number;
  headshotImmunity: boolean;
  vampirismPercentage: number;
  assasinationImmunity: boolean;
  deathless: boolean;
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
  damageModifierPercentageSetting: DamageModifier;
  meleeDamageModifierPercentageSetting: DamageModifier;
  initialPrimaryWeaponAbsoluteIndex: number; // object_lists/weapons.txt
  initialSecondaryWeaponAbsoluteIndex: number; // object_lists/weapons.txt
  initialGrenadeCount: GrenadeCountSetting;
  rechargingGrenades: boolean;
  infiniteAmmo: InfiniteAmmoSetting;
  weaponPickup: boolean;
  equipmentUsage: boolean;
  dropEquipment: boolean;
  infiniteEquipment: boolean;
  initialEquipmentAbsoluteIndex: number; // object_lists/equipment.txt
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
  speedPercentage: number;
  gravityPercentage: number;
  vehicleUsage: VehicleUsage;
  jumpModifier: number; // % expressed as an integer
  sprinting: boolean;
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
  activeCamo: ActiveCamo;
  waypoint: WaypointVisibility;
  gamertag: WaypointVisibility;
  forcedChangeColor: ForcedChangeColor;
}>;

export enum MotionTrackerMode {
  Unchanged = 0,
  Off = 1,
  Allies = 2,
  Normal = 3,
  Enhanced = 4,
}

export type PlayerTraitSensors = Partial<{
  motionTrackerMode: MotionTrackerMode;
  motionTrackerRange: number;
}>;

export type PlayerTraits = {
  shieldVitality: PlayerTraitShieldVitality;
  weapons: PlayerTraitWeapons;
  movement: PlayerTraitMovement;
  appearance: PlayerTraitAppearance;
  sensors: PlayerTraitSensors;
};
