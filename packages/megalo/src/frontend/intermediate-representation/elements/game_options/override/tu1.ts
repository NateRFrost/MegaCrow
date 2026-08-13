import type { OverrideEntryNode } from "src/frontend/abstract-syntax-tree/elements/game_options";
import {
  resolveSimpleBoolean,
  resolveSimpleNumber,
} from "src/frontend/intermediate-representation/elements/game_options/override/helpers";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { setField } from "src/frontend/intermediate-representation/setField";

/** Returns true if `optionName` was handled as a tu1 override. */
export const tryLowerTu1Override = (
  optionName: string,
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
): boolean => {
  const { diagnostics, ir } = ctx;
  const tu1 = ir.gameVariant.tu1Settings;

  switch (optionName) {
    case "tu1_always_spillover_damage": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "alwaysSpilloverDamage",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_armor_lock_stickies_remain": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "armorLockStickiesRemain",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_attached_damage_bypass_shields": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "attachedDamageBypassShields",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_active_camo_override_energy_curve": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "activeCamoOverrideEnergyCurve",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_sword_gun_clang_kills": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "swordGunClangKills",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_magnum_is_automatic": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "magnumIsAutomatic",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_headshot_weapon_reticule_bloom_multiplier": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "precisionBloom",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_armor_lock_damage_to_energy_transfer": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "armorLockDamageDrain",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_armor_lock_damage_to_energy_cap": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "armorLockDamageDrainLimit",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_active_camo_override_energy_curve_min": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "activeCamoEnergyCurveMin",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_active_camo_override_energy_curve_max": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "activeCamoEnergyCurveMax",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_magnum_damage_multiplier": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "magnumDamage",
        value.value,
        value.location
      );
      return true;
    }
    case "tu1_magnum_fire_recovery_time_multiplier": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        tu1,
        "magnumFireDelay",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
