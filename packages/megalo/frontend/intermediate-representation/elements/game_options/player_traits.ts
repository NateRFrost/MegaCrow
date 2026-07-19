import { isAstErrorNode, SyntaxKind } from "../../../abstract-syntax-tree";
import type {
  PlayerTraitOptionNode,
  PlayerTraitsElementNode,
} from "../../../abstract-syntax-tree/elements/game_options/player_traits";
import type {
  ASTGrenadeCountNode,
  ASTParameterNode,
} from "../../../abstract-syntax-tree/parameters";
import type { Diagnostics, SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { SymbolKind, type SymbolTable } from "../../../symbol-table";
import { type IR, type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { markCurrentValueUnused } from "../../diagnostics/markCurrentValueUnused";
import { LowerError } from "../../error";
import {
  ActiveCamo,
  ForcedChangeColor,
  GrenadeCountSetting,
  InfiniteAmmoSetting,
  MotionTrackerMode,
  type PlayerTraits,
  VehicleUsage,
  WaypointVisibility,
} from "../../game/game_engine_player_traits";
import type { PlayerTraitOption } from "../../game/game_engine_traits";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { emptyPlayerTraits, resolveNumericValue } from "./shared";

const parameterLocation = (
  parameters: ASTParameterNode[],
  fallback: SourceCodeLocation
): SourceCodeLocation => parameters[0]?.location ?? fallback;

const resolveIntegerParameter = (
  node: ASTParameterNode,
  symbolTable: SymbolTable
): ValueWithLocation<number> => {
  if (node.kind === SyntaxKind.INTEGER) {
    return valueWithLocation(node.value, node.location);
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    return resolveNumericValue(node, symbolTable);
  }
  if (node.kind === SyntaxKind.KEYWORD) {
    const asNumber = Number(node.value);
    if (!Number.isNaN(asNumber)) {
      return valueWithLocation(asNumber, node.location);
    }
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("number", ""),
    node.location
  );
};

const resolveBooleanParameter = (
  node: ASTParameterNode,
  symbolTable: SymbolTable
): ValueWithLocation<boolean> => {
  const value = resolveIntegerParameter(node, symbolTable);
  return valueWithLocation(Number(value) !== 0, value.location);
};

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

const resolveObjectListIndex = (
  node: ASTParameterNode,
  symbolTable: SymbolTable,
  objectType: ObjectListType.Weapons | ObjectListType.Equipment
): ValueWithLocation<number> => {
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = symbolTable.getSymbol(node.symbolId);
    if (
      symbol?.kind === SymbolKind.ObjectListItem &&
      symbol.objectType === objectType
    ) {
      return valueWithLocation(symbol.index, node.location);
    }
  }

  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : undefined;
  if (name !== undefined) {
    const match = symbolTable
      .toArray()
      .find(
        (entry) =>
          entry.kind === SymbolKind.ObjectListItem &&
          entry.objectType === objectType &&
          entry.name === name
      );
    if (match !== undefined && match.kind === SymbolKind.ObjectListItem) {
      return valueWithLocation(match.index, node.location);
    }
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType(objectType, name ?? ""),
    node.location
  );
};

const resolvePercentageOrKeyword = <K extends string>(
  node: ASTParameterNode,
  symbolTable: SymbolTable,
  keyword: K
): ValueWithLocation<K | number> => {
  if (node.kind === SyntaxKind.KEYWORD && node.value === keyword) {
    return valueWithLocation(keyword, node.location);
  }
  return resolveIntegerParameter(node, symbolTable);
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

const lowerGrenadeCount = (
  node: ASTGrenadeCountNode
): ValueWithLocation<GrenadeCountSetting> => {
  if (node.form === "preset") {
    switch (node.value.value) {
      case "none":
        return valueWithLocation(GrenadeCountSetting.Zero, node.location);
      case "default":
        return valueWithLocation(GrenadeCountSetting.Default, node.location);
      default:
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "grenade_count",
            node.value.value
          ),
          node.location
        );
    }
  }

  const count = node.count.value;
  const grenadeType = node.grenadeType.value;
  let setting: GrenadeCountSetting | undefined;
  switch (grenadeType) {
    case "frag":
      switch (count) {
        case 1:
          setting = GrenadeCountSetting.Frag1;
          break;
        case 2:
          setting = GrenadeCountSetting.Frag2;
          break;
        case 3:
          setting = GrenadeCountSetting.Frag3;
          break;
        case 4:
          setting = GrenadeCountSetting.Frag4;
          break;
      }
      break;
    case "plasma":
      switch (count) {
        case 1:
          setting = GrenadeCountSetting.Plasma1;
          break;
        case 2:
          setting = GrenadeCountSetting.Plasma2;
          break;
        case 3:
          setting = GrenadeCountSetting.Plasma3;
          break;
        case 4:
          setting = GrenadeCountSetting.Plasma4;
          break;
      }
      break;
    case "each":
      switch (count) {
        case 1:
          setting = GrenadeCountSetting.Each1;
          break;
        case 2:
          setting = GrenadeCountSetting.Each2;
          break;
        case 3:
          setting = GrenadeCountSetting.Each3;
          break;
        case 4:
          setting = GrenadeCountSetting.Each4;
          break;
      }
      break;
  }

  if (setting === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "grenade_count",
        `${count} ${grenadeType}`
      ),
      node.location
    );
  }
  return valueWithLocation(setting, node.location);
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
      current as ValueWithLocation<unknown>,
      diagnostics
    );
  }
  return next;
};

export const lowerPlayerTraitOptions = (
  options: PlayerTraitOptionNode[],
  symbolTable: SymbolTable,
  diagnostics: Diagnostics,
  fallbackLocation: SourceCodeLocation
): PlayerTraits => {
  const traits = emptyPlayerTraits();

  for (const option of options) {
    const { identifier, parameters } = option;
    const location = parameterLocation(parameters, fallbackLocation);
    const first = parameters[0];

    switch (identifier) {
      case "damage_resistance": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.damageResistancePercentage = setField(
          diagnostics,
          traits.shieldVitality.damageResistancePercentage,
          resolvePercentageOrKeyword(first, symbolTable, "invulnerable")
        );
        break;
      }
      case "body_recharge": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.bodyRechargeRatePercentage = setField(
          diagnostics,
          traits.shieldVitality.bodyRechargeRatePercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "shield_recharge": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.shieldRechargeRatePercentage = setField(
          diagnostics,
          traits.shieldVitality.shieldRechargeRatePercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "vampirism": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.vampirismPercentage = setField(
          diagnostics,
          traits.shieldVitality.vampirismPercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "headshot_immunity": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.shieldVitality.headshotImmunity = setField(
          diagnostics,
          traits.shieldVitality.headshotImmunity,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "body_multiplier": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.bodyMultiplierPercentage = setField(
          diagnostics,
          traits.shieldVitality.bodyMultiplierPercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "shield_multiplier": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.shieldVitality.shieldMultiplierPercentage = setField(
          diagnostics,
          traits.shieldVitality.shieldMultiplierPercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "assassination_immunity": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.shieldVitality.assasinationImmunity = setField(
          diagnostics,
          traits.shieldVitality.assasinationImmunity,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "damage_modifier": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.weapons.damageModifierPercentageSetting = setField(
          diagnostics,
          traits.weapons.damageModifierPercentageSetting,
          resolvePercentageOrKeyword(first, symbolTable, "fatality")
        );
        break;
      }
      case "melee_damage_modifier": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.weapons.meleeDamageModifierPercentageSetting = setField(
          diagnostics,
          traits.weapons.meleeDamageModifierPercentageSetting,
          resolvePercentageOrKeyword(first, symbolTable, "fatality")
        );
        break;
      }
      case "initial_primary_weapon": {
        if (first === undefined) {
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
          resolveObjectListIndex(first, symbolTable, ObjectListType.Weapons)
        );
        break;
      }
      case "initial_secondary_weapon": {
        if (first === undefined) {
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
          resolveObjectListIndex(first, symbolTable, ObjectListType.Weapons)
        );
        break;
      }
      case "initial_equipment": {
        if (first === undefined) {
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
          resolveObjectListIndex(first, symbolTable, ObjectListType.Equipment)
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
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.weapons.rechargingGrenades = setField(
          diagnostics,
          traits.weapons.rechargingGrenades,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "infinite_ammo": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        const enabled = Number(resolveIntegerParameter(first, symbolTable)) !== 0;
        traits.weapons.infiniteAmmo = setField(
          diagnostics,
          traits.weapons.infiniteAmmo,
          valueWithLocation(
            enabled ? InfiniteAmmoSetting.Enabled : InfiniteAmmoSetting.Disabled,
            first.location
          )
        );
        break;
      }
      case "bottomless_clip": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        const enabled = Number(resolveIntegerParameter(first, symbolTable)) !== 0;
        traits.weapons.infiniteAmmo = setField(
          diagnostics,
          traits.weapons.infiniteAmmo,
          valueWithLocation(
            enabled
              ? InfiniteAmmoSetting.BottomlessClip
              : InfiniteAmmoSetting.Disabled,
            first.location
          )
        );
        break;
      }
      case "weapon_pickup": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.weapons.weaponPickup = setField(
          diagnostics,
          traits.weapons.weaponPickup,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "drop_equipment": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.weapons.dropEquipment = setField(
          diagnostics,
          traits.weapons.dropEquipment,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "infinite_equipment": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("boolean", ""),
            location
          );
        }
        traits.weapons.infiniteEquipment = setField(
          diagnostics,
          traits.weapons.infiniteEquipment,
          resolveBooleanParameter(first, symbolTable)
        );
        break;
      }
      case "speed": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.movement.speedPercentage = setField(
          diagnostics,
          traits.movement.speedPercentage,
          resolveIntegerParameter(first, symbolTable)
        );
        break;
      }
      case "gravity": {
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.movement.gravityPercentage = setField(
          diagnostics,
          traits.movement.gravityPercentage,
          resolveIntegerParameter(first, symbolTable)
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
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("integer", ""),
            location
          );
        }
        traits.movement.jumpModifier = setField(
          diagnostics,
          traits.movement.jumpModifier,
          resolveIntegerParameter(first, symbolTable)
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
        if (first === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType("percentage", ""),
            location
          );
        }
        traits.sensors.motionTrackerRange = setField(
          diagnostics,
          traits.sensors.motionTrackerRange,
          resolveIntegerParameter(first, symbolTable)
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

export const lowerPlayerTraits = (
  entry: PlayerTraitsElementNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
    if (isAstErrorNode(entry.name)) {
      return;
    }
    const traits = lowerPlayerTraitOptions(
      entry.options,
      symbolTable,
      diagnostics,
      entry.location
    );
    const option: PlayerTraitOption = {
      name: valueWithLocation(
        resolveScriptStringTableReference(entry.displayName, ir, symbolTable),
        entry.displayName.location
      ),
      description: valueWithLocation(
        resolveScriptStringTableReference(entry.description, ir, symbolTable),
        entry.description.location
      ),
      traits: valueWithLocation(traits, entry.location),
    };
    ir.gameVariant.playerTraits.push(option);
  });
};
