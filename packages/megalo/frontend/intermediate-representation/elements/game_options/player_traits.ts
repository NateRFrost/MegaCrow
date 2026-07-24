import { SyntaxKind } from "../../../abstract-syntax-tree";
import type {
  PlayerTraitOptionNode,
  PlayerTraitsElementNode,
} from "../../../abstract-syntax-tree/elements/game_options/player_traits";
import type {
  ASTParameterNode,
} from "../../../abstract-syntax-tree/parameters";
import type { Diagnostics, SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import { markCurrentValueUnused } from "../../diagnostics/markCurrentValueUnused";
import { LowerError } from "../../error";
import {
  ActiveCamo,
  ForcedChangeColor,
  InfiniteAmmoSetting,
  MotionTrackerMode,
  type PlayerTraits,
  VehicleUsage,
  WaypointVisibility,
} from "../../game/game_engine_player_traits";
import type { PlayerTraitOption } from "../../game/game_engine_traits";
import {
  asParameterLoweringContext,
  buildParameterLowerer,
  keywordParam,
  lowerBooleanParam,
  lowerNumberParam,
  numberParam,
  objectTypeParam,
  type ElementLowerContext,
  type ParameterLoweringContext,
} from "../../parameters";
import { lowerGrenadeCount } from "../../parameters/grenadeCount";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { emptyPlayerTraits } from "./shared";

const parameterLocation = (
  parameters: ASTParameterNode[],
  fallback: SourceCodeLocation
): SourceCodeLocation => parameters[0]?.location ?? fallback;

const resolveKeyword = (node: ASTParameterNode | undefined): string | undefined => {
  if (node === undefined) {
    return undefined;
  }
  if (node.kind === SyntaxKind.KEYWORD) {
    return node.value;
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    return node.identifier;
  }
  return undefined;
};

const resolveEnumKeyword = <T extends number>(
  node: ASTParameterNode,
  mapping: Record<string, T>,
  expected: string
): ValueWithLocation<T> => {
  const name = resolveKeyword(node);
  if (name === undefined || mapping[name] === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, name ?? ""),
      node.location
    );
  }
  return valueWithLocation(mapping[name]!, node.location);
};

const VEHICLE_USAGE: Record<string, VehicleUsage> = {
  unchanged: VehicleUsage.Unchanged,
  none: VehicleUsage.None,
  full: VehicleUsage.Full,
  passenger: VehicleUsage.Passenger,
  not_passenger: VehicleUsage.NotPassenger,
  driver: VehicleUsage.Driver,
  gunner: VehicleUsage.Gunner,
  not_driver: VehicleUsage.NotDriver,
  not_gunner: VehicleUsage.NotGunner,
};

const ACTIVE_CAMO: Record<string, ActiveCamo> = {
  off: ActiveCamo.Off,
  on: ActiveCamo.On,
  poor: ActiveCamo.Poor,
  good: ActiveCamo.Good,
  excellent: ActiveCamo.Excellent,
  invisible: ActiveCamo.Invisible,
};

const WAYPOINT: Record<string, WaypointVisibility> = {
  unchanged: WaypointVisibility.Unchanged,
  off: WaypointVisibility.Off,
  allies: WaypointVisibility.Allies,
  all: WaypointVisibility.All,
};

const FORCED_COLOR: Record<string, ForcedChangeColor> = {
  unchanged: ForcedChangeColor.Unchanged,
  off: ForcedChangeColor.Off,
  red: ForcedChangeColor.Red,
  blue: ForcedChangeColor.Blue,
  green: ForcedChangeColor.Green,
  yellow: ForcedChangeColor.Yellow,
  purple: ForcedChangeColor.Purple,
  orange: ForcedChangeColor.Orange,
  brown: ForcedChangeColor.Brown,
  pink: ForcedChangeColor.Pink,
  // TODO: Check
  white: ForcedChangeColor.White,
  black: ForcedChangeColor.Black,
  zombie: ForcedChangeColor.Zombie,
  extra4: ForcedChangeColor.Extra4,
};

const MOTION_TRACKER: Record<string, MotionTrackerMode> = {
  unchanged: MotionTrackerMode.Unchanged,
  off: MotionTrackerMode.Off,
  allies: MotionTrackerMode.Allies,
  normal: MotionTrackerMode.Normal,
  enhanced: MotionTrackerMode.Enhanced,
};

const EQUIPMENT_USAGE_ENABLED = new Set(["on", "enabled"]);
const EQUIPMENT_USAGE_DISABLED = new Set(["off", "disabled"]);

const setField = <T>(
  diagnostics: Diagnostics,
  current: T | undefined,
  next: T
): T => {
  if (
    current !== undefined &&
    current !== null &&
    typeof current === "object" &&
    "location" in current
  ) {
    markCurrentValueUnused(
      current as unknown as ValueWithLocation<unknown>,
      diagnostics
    );
  }
  return next;
};

export const lowerPlayerTraitOptions = (
  options: PlayerTraitOptionNode[],
  ctx: ParameterLoweringContext,
  fallbackLocation: SourceCodeLocation
): PlayerTraits => {
  const traits = emptyPlayerTraits();
  const { diagnostics } = ctx;

  for (const option of options) {
    const { identifier, parameters } = option;
    const location = parameterLocation(parameters, fallbackLocation);
    const first = parameters[0];

    switch (identifier) {
      case "damage_resistance": {
        const result = buildParameterLowerer(
          [keywordParam("mode", "invulnerable")],
          [numberParam("value")]
        )(parameters, ctx);
        const mode = result.byName("mode");
        const value =
          mode !== undefined
            ? valueWithLocation("invulnerable" as const, mode.location)
            : (result.byName("value") as
                | ValueWithLocation<number>
                | undefined);
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.damageResistancePercentage = setField(
          diagnostics,
          traits.shieldVitality.damageResistancePercentage,
          value
        );
        break;
      }
      case "body_recharge": {
        traits.shieldVitality.bodyRechargeRatePercentage = setField(
          diagnostics,
          traits.shieldVitality.bodyRechargeRatePercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "shield_recharge": {
        traits.shieldVitality.shieldRechargeRatePercentage = setField(
          diagnostics,
          traits.shieldVitality.shieldRechargeRatePercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "vampirism": {
        traits.shieldVitality.vampirismPercentage = setField(
          diagnostics,
          traits.shieldVitality.vampirismPercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "headshot_immunity": {
        traits.shieldVitality.headshotImmunity = setField(
          diagnostics,
          traits.shieldVitality.headshotImmunity,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "body_multiplier": {
        traits.shieldVitality.bodyMultiplierPercentage = setField(
          diagnostics,
          traits.shieldVitality.bodyMultiplierPercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "shield_multiplier": {
        traits.shieldVitality.shieldMultiplierPercentage = setField(
          diagnostics,
          traits.shieldVitality.shieldMultiplierPercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "assassination_immunity": {
        traits.shieldVitality.assasinationImmunity = setField(
          diagnostics,
          traits.shieldVitality.assasinationImmunity,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "damage_modifier": {
        const result = buildParameterLowerer(
          [keywordParam("mode", "fatality")],
          [numberParam("value")]
        )(parameters, ctx);
        const mode = result.byName("mode");
        const value =
          mode !== undefined
            ? valueWithLocation("fatality" as const, mode.location)
            : (result.byName("value") as
                | ValueWithLocation<number>
                | undefined);
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.weapons.damageModifierPercentageSetting = setField(
          diagnostics,
          traits.weapons.damageModifierPercentageSetting,
          value
        );
        break;
      }
      case "melee_damage_modifier": {
        const result = buildParameterLowerer(
          [keywordParam("mode", "fatality")],
          [numberParam("value")]
        )(parameters, ctx);
        const mode = result.byName("mode");
        const value =
          mode !== undefined
            ? valueWithLocation("fatality" as const, mode.location)
            : (result.byName("value") as
                | ValueWithLocation<number>
                | undefined);
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.weapons.meleeDamageModifierPercentageSetting = setField(
          diagnostics,
          traits.weapons.meleeDamageModifierPercentageSetting,
          value
        );
        break;
      }
      case "initial_primary_weapon": {
        const result = buildParameterLowerer([
          objectTypeParam("weapon", ObjectListType.Weapons),
        ])(parameters, ctx);
        const value = result.byName("weapon") as
          | ValueWithLocation<number>
          | undefined;
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              ObjectListType.Weapons,
              ""
            ),
            location
          );
        }
        traits.weapons.initialPrimaryWeaponAbsoluteIndex = setField(
          diagnostics,
          traits.weapons.initialPrimaryWeaponAbsoluteIndex,
          value
        );
        break;
      }
      case "initial_secondary_weapon": {
        const result = buildParameterLowerer([
          objectTypeParam("weapon", ObjectListType.Weapons),
        ])(parameters, ctx);
        const value = result.byName("weapon") as
          | ValueWithLocation<number>
          | undefined;
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              ObjectListType.Weapons,
              ""
            ),
            location
          );
        }
        traits.weapons.initialSecondaryWeaponAbsoluteIndex = setField(
          diagnostics,
          traits.weapons.initialSecondaryWeaponAbsoluteIndex,
          value
        );
        break;
      }
      case "initial_equipment": {
        const result = buildParameterLowerer([
          objectTypeParam("equipment", ObjectListType.Equipment),
        ])(parameters, ctx);
        const value = result.byName("equipment") as
          | ValueWithLocation<number>
          | undefined;
        if (value === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              ObjectListType.Equipment,
              ""
            ),
            location
          );
        }
        traits.weapons.initialEquipmentAbsoluteIndex = setField(
          diagnostics,
          traits.weapons.initialEquipmentAbsoluteIndex,
          value
        );
        break;
      }
      case "initial_grenades": {
        const grenadeCount = parameters[0];
        if (
          grenadeCount === undefined ||
          grenadeCount.kind !== SyntaxKind.GRENADE_COUNT
        ) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "grenade_count",
              grenadeCount?.kind === SyntaxKind.KEYWORD
                ? grenadeCount.value
                : ""
            ),
            location
          );
        }
        traits.weapons.initialGrenadeCount = setField(
          diagnostics,
          traits.weapons.initialGrenadeCount,
          lowerGrenadeCount(grenadeCount)
        );
        break;
      }
      case "recharging_grenades": {
        traits.weapons.rechargingGrenades = setField(
          diagnostics,
          traits.weapons.rechargingGrenades,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "infinite_ammo": {
        const enabled = lowerNumberParam(parameters, ctx, "boolean", location);
        traits.weapons.infiniteAmmo = setField(
          diagnostics,
          traits.weapons.infiniteAmmo,
          valueWithLocation(
            enabled.value !== 0
              ? InfiniteAmmoSetting.Enabled
              : InfiniteAmmoSetting.Disabled,
            enabled.location
          )
        );
        break;
      }
      case "bottomless_clip": {
        const enabled = lowerNumberParam(parameters, ctx, "boolean", location);
        traits.weapons.infiniteAmmo = setField(
          diagnostics,
          traits.weapons.infiniteAmmo,
          valueWithLocation(
            enabled.value !== 0
              ? InfiniteAmmoSetting.BottomlessClip
              : InfiniteAmmoSetting.Disabled,
            enabled.location
          )
        );
        break;
      }
      case "weapon_pickup": {
        traits.weapons.weaponPickup = setField(
          diagnostics,
          traits.weapons.weaponPickup,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "drop_equipment": {
        traits.weapons.dropEquipment = setField(
          diagnostics,
          traits.weapons.dropEquipment,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "infinite_equipment": {
        traits.weapons.infiniteEquipment = setField(
          diagnostics,
          traits.weapons.infiniteEquipment,
          lowerBooleanParam(parameters, ctx, location)
        );
        break;
      }
      case "speed": {
        traits.movement.speedPercentage = setField(
          diagnostics,
          traits.movement.speedPercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "gravity": {
        traits.movement.gravityPercentage = setField(
          diagnostics,
          traits.movement.gravityPercentage,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      case "vehicle_usage": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("vehicle_usage", ""),
            location
          );
        }
        traits.movement.vehicleUsage = setField(
          diagnostics,
          traits.movement.vehicleUsage,
          resolveEnumKeyword(first, VEHICLE_USAGE, "vehicle_usage")
        );
        break;
      }
      case "jump_modifier": {
        traits.movement.jumpModifier = setField(
          diagnostics,
          traits.movement.jumpModifier,
          lowerNumberParam(parameters, ctx, "integer", location)
        );
        break;
      }
      case "sprinting": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("sprinting", ""),
            location
          );
        }
        const name = resolveKeyword(first);
        let enabled: boolean;
        switch (name) {
          case "true":
          case "enabled":
            enabled = true;
            break;
          case "false":
          case "disabled":
            enabled = false;
            break;
          default:
            throw new LowerError(
              diagnosticMessages.expectedParameterType(
                "sprinting",
                name ?? ""
              ),
              first.location
            );
        }
        traits.movement.sprinting = setField(
          diagnostics,
          traits.movement.sprinting,
          valueWithLocation(enabled, first.location)
        );
        break;
      }
      case "equipment_usage": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("equipment_usage", ""),
            location
          );
        }
        const name = resolveKeyword(first);
        let enabled: boolean;
        if (name !== undefined && EQUIPMENT_USAGE_ENABLED.has(name)) {
          enabled = true;
        } else if (name !== undefined && EQUIPMENT_USAGE_DISABLED.has(name)) {
          enabled = false;
        } else {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "equipment_usage",
              name ?? ""
            ),
            first.location
          );
        }
        traits.weapons.equipmentUsage = setField(
          diagnostics,
          traits.weapons.equipmentUsage,
          valueWithLocation(enabled, first.location)
        );
        break;
      }
      case "active_camo": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("active_camo", ""),
            location
          );
        }
        traits.appearance.activeCamo = setField(
          diagnostics,
          traits.appearance.activeCamo,
          resolveEnumKeyword(first, ACTIVE_CAMO, "active_camo")
        );
        break;
      }
      case "waypoint": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("waypoint", ""),
            location
          );
        }
        traits.appearance.waypoint = setField(
          diagnostics,
          traits.appearance.waypoint,
          resolveEnumKeyword(first, WAYPOINT, "waypoint")
        );
        break;
      }
      case "gamertag_visibility": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("waypoint", ""),
            location
          );
        }
        traits.appearance.gamertag = setField(
          diagnostics,
          traits.appearance.gamertag,
          resolveEnumKeyword(first, WAYPOINT, "waypoint")
        );
        break;
      }
      case "color": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("color", ""),
            location
          );
        }
        if (parameters.length > 1) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("color", "rgb"),
            first.location
          );
        }
        traits.appearance.forcedChangeColor = setField(
          diagnostics,
          traits.appearance.forcedChangeColor,
          resolveEnumKeyword(first, FORCED_COLOR, "color")
        );
        break;
      }
      case "tracker_mode": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("tracker_mode", ""),
            location
          );
        }
        traits.sensors.motionTrackerMode = setField(
          diagnostics,
          traits.sensors.motionTrackerMode,
          resolveEnumKeyword(first, MOTION_TRACKER, "tracker_mode")
        );
        break;
      }
      case "tracker_range": {
        traits.sensors.motionTrackerRange = setField(
          diagnostics,
          traits.sensors.motionTrackerRange,
          lowerNumberParam(parameters, ctx, "percentage", location)
        );
        break;
      }
      default:
        throw new LowerError(
          diagnosticMessages.unknownPlayerTrait(identifier),
          location
        );
    }
  }

  return traits;
};


/**
 * @link https://blam-network.github.io/megalo/language/elements/game-options/player-traits
 */
export const lowerPlayerTraits = (
  entry: PlayerTraitsElementNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);
    const traits = lowerPlayerTraitOptions(
      entry.options,
      asParameterLoweringContext(ctx),
      entry.location
    );
    const option: PlayerTraitOption = {
      name: valueWithLocation(
        resolveScriptStringTableReference(
          entry.displayName,
          ctx.ir,
          ctx.symbolTable
        ),
        entry.displayName.location
      ),
      description: valueWithLocation(
        resolveScriptStringTableReference(
          entry.description,
          ctx.ir,
          ctx.symbolTable
        ),
        entry.description.location
      ),
      traits: valueWithLocation(traits, entry.location),
    };
    ctx.ir.gameVariant.playerTraits.push(option);
  });
};
