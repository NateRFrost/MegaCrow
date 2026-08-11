import { SyntaxKind } from "../../../../abstract-syntax-tree";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../../object-lists";
import { located } from "../../..";
import { LowerError } from "../../../error";
import {
  InfiniteAmmoSetting,
  type PlayerTraits,
} from "../../../game/game_engine_player_traits";
import { lowerBooleanParam, lowerNumberParam } from "../../../parameters";
import { lowerGrenadeCount } from "../../../parameters/grenadeCount";
import { setField } from "../../../setField";
import {
  lowerObjectListIndex,
  resolveKeyword,
  type TraitOptionArgs,
} from "./helpers";

const EQUIPMENT_USAGE_ENABLED = new Set(["on", "enabled"]);
const EQUIPMENT_USAGE_DISABLED = new Set(["off", "disabled"]);

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
      } else if (
        firstParam.kind === SyntaxKind.INTEGER ||
        firstParam.kind === SyntaxKind.FLOATING_POINT
      ) {
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
      } else if (
        firstParam.kind === SyntaxKind.INTEGER ||
        firstParam.kind === SyntaxKind.FLOATING_POINT
      ) {
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
      const value = lowerObjectListIndex(
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
      const value = lowerObjectListIndex(
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
      const value = lowerObjectListIndex(
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
      const enabled = lowerNumberParam(parameters, ctx, "boolean", location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "infiniteAmmo",
        enabled.value !== 0
          ? InfiniteAmmoSetting.Enabled
          : InfiniteAmmoSetting.Disabled,
        enabled.location
      );
      return true;
    }
    case "bottomless_clip": {
      const enabled = lowerNumberParam(parameters, ctx, "boolean", location);
      setField(
        ir.locations,
        diagnostics,
        traits.weapons,
        "infiniteAmmo",
        enabled.value !== 0
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
