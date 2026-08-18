import {
  type MegaloEnumNames,
  megaloEnum,
} from "src/frontend/intermediate-representation/megaloEnum";
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

export const grenadeCountSetting = megaloEnum([
  "none",
  "default",
  "1 frag",
  "2 frag",
  "3 frag",
  "4 frag",
  "1 plasma",
  "2 plasma",
  "3 plasma",
  "4 plasma",
  "1 each",
  "2 each",
  "3 each",
  "4 each",
] as const);
export const GrenadeCountSetting = grenadeCountSetting.enum;
export type GrenadeCountSetting = MegaloEnumNames<typeof grenadeCountSetting>;

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

export const vehicleUsage = megaloEnum([
  "unchanged",
  "none",
  "passenger",
  "driver",
  "gunner",
  "not_passenger",
  "not_driver",
  "not_gunner",
  "full",
] as const);
export const VehicleUsage = vehicleUsage.enum;
export type VehicleUsage = MegaloEnumNames<typeof vehicleUsage>;

/** MegaCrow extension `doubleJump`: Reach wire double-jump trait. */
export const doubleJump = megaloEnum([
  "disabled",
  "enabled",
  "triple",
] as const);
export const DoubleJump = doubleJump.enum;
export type DoubleJump = MegaloEnumNames<typeof doubleJump>;

export type PlayerTraitMovement = Partial<{
  speedPercentage: number;
  gravityPercentage: number;
  vehicleUsage: VehicleUsage;
  jumpModifier: number; // % expressed as an integer
  sprinting: boolean;
  doubleJump: DoubleJump;
}>;

export const activeCamo = megaloEnum([
  "off",
  "on",
  "poor",
  "good",
  "excellent",
  "invisible",
] as const);
export const ActiveCamo = activeCamo.enum;
export type ActiveCamo = MegaloEnumNames<typeof activeCamo>;

export const waypointVisibility = megaloEnum([
  "unchanged",
  "off",
  "allies",
  "all",
] as const);
export const WaypointVisibility = waypointVisibility.enum;
export type WaypointVisibility = MegaloEnumNames<typeof waypointVisibility>;

export const forcedChangeColor = megaloEnum([
  "unchanged",
  "off",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "brown",
  "pink",
  "white",
  "black",
  "zombie",
  "extra4",
] as const);
export const ForcedChangeColor = forcedChangeColor.enum;
export type ForcedChangeColor = MegaloEnumNames<typeof forcedChangeColor>;

export type PlayerTraitAppearance = Partial<{
  activeCamo: ActiveCamo;
  waypoint: WaypointVisibility;
  gamertag: WaypointVisibility;
  forcedChangeColor: ForcedChangeColor;
}>;

export const motionTrackerMode = megaloEnum([
  "unchanged",
  "off",
  "allies",
  "normal",
  "enhanced",
] as const);
export const MotionTrackerMode = motionTrackerMode.enum;
export type MotionTrackerMode = MegaloEnumNames<typeof motionTrackerMode>;

export type PlayerTraitSensors = Partial<{
  motionTrackerMode: MotionTrackerMode;
  motionTrackerRange: number;
}>;

export interface PlayerTraits {
  appearance: PlayerTraitAppearance;
  movement: PlayerTraitMovement;
  sensors: PlayerTraitSensors;
  shieldVitality: PlayerTraitShieldVitality;
  weapons: PlayerTraitWeapons;
}
