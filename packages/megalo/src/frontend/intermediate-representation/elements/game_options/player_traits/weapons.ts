import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { ObjectListType } from "src/frontend/object-lists";
import { located } from "src/frontend/intermediate-representation";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  InfiniteAmmoSetting,
  type PlayerTraits,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { lowerBooleanParam } from "src/frontend/intermediate-representation/parameters";
import { lowerGrenadeCount } from "src/frontend/intermediate-representation/parameters/grenadeCount";
import { setField } from "src/frontend/intermediate-representation/setField";
import {
  lowerObjectListIndex,
  resolveKeyword,
  type TraitOptionArgs,
} from "src/frontend/intermediate-representation/elements/game_options/player_traits/helpers";

const EQUIPMENT_USAGE_ENABLED = new Set(["on", "enabled"]);
const EQUIPMENT_USAGE_DISABLED = new Set(["off", "disabled"]);

const OBJECT_LIST_SENTINELS: Record<string, number> = {
  none: -1,
  default: -2,
  random: -3,
};

const lowerWeaponOrEquipmentIndex = (
  parameters: ASTParameterNode[],
  ctx: TraitOptionArgs["ctx"],
  objectType: ObjectListType,
  location: SourceCodeLocation
) => {
  const first = parameters[0];
  const sentinel = resolveKeyword(first);
  if (sentinel !== undefined && OBJECT_LIST_SENTINELS[sentinel] !== undefined) {
    return located(OBJECT_LIST_SENTINELS[sentinel]!, first!.location);
  }
  return lowerObjectListIndex(parameters, ctx, objectType, location);
};

/** Returns true if `identifier` was handled as a weapons trait. */
export const lowerWeaponsOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { parameters, first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "damage_modifier": {
      const firstParam = parameters[0];
      if (firstParam === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      let value;
      if (resolveKeyword(firstParam) === "fatality") {
        value = located("fatality" as const, firstParam.location);
      } else if (firstParam.kind === SyntaxKind.INTEGER) {
        value = located(firstParam.value, firstParam.location);
      } else {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          firstParam.location
        );
      }
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "damageModifierPercentageSetting",
        value.value,
        value.location
      );
      return true;
    }
    case "melee_damage_modifier": {
      const firstParam = parameters[0];
      if (firstParam === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      let value;
      if (resolveKeyword(firstParam) === "fatality") {
        value = located("fatality" as const, firstParam.location);
      } else if (firstParam.kind === SyntaxKind.INTEGER) {
        value = located(firstParam.value, firstParam.location);
      } else {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          firstParam.location
        );
      }
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "meleeDamageModifierPercentageSetting",
        value.value,
        value.location
      );
      return true;
    }
    case "initial_primary_weapon": {
      const value = lowerWeaponOrEquipmentIndex(
        parameters,
        ctx,
        ObjectListType.Weapons,
        location
      );
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "initialPrimaryWeaponAbsoluteIndex",
        value.value,
        value.location
      );
      return true;
    }
    case "initial_secondary_weapon": {
      const value = lowerWeaponOrEquipmentIndex(
        parameters,
        ctx,
        ObjectListType.Weapons,
        location
      );
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "initialSecondaryWeaponAbsoluteIndex",
        value.value,
        value.location
      );
      return true;
    }
    case "initial_equipment": {
      const value = lowerWeaponOrEquipmentIndex(
        parameters,
        ctx,
        ObjectListType.Equipment,
        location
      );
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "initialEquipmentAbsoluteIndex",
        value.value,
        value.location
      );
      return true;
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
      const value = lowerGrenadeCount(grenadeCount);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "initialGrenadeCount",
        value.value,
        value.location
      );
      return true;
    }
    case "recharging_grenades": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "rechargingGrenades",
        value.value,
        value.location
      );
      return true;
    }
    case "infinite_ammo": {
      const enabled = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "infiniteAmmo",
        enabled.value
          ? InfiniteAmmoSetting.Enabled
          : InfiniteAmmoSetting.Disabled,
        enabled.location
      );
      return true;
    }
    case "bottomless_clip": {
      const enabled = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "infiniteAmmo",
        enabled.value
          ? InfiniteAmmoSetting.BottomlessClip
          : InfiniteAmmoSetting.Disabled,
        enabled.location
      );
      return true;
    }
    case "weapon_pickup": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "weaponPickup",
        value.value,
        value.location
      );
      return true;
    }
    case "drop_equipment": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "dropEquipment",
        value.value,
        value.location
      );
      return true;
    }
    case "infinite_equipment": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "infiniteEquipment",
        value.value,
        value.location
      );
      return true;
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
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "equipmentUsage",
        enabled,
        first.location
      );
      return true;
    }
    default:
      return false;
  }
};
