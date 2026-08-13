import type { OverrideEntryNode } from "../../../../abstract-syntax-tree/elements/game_options";
import type { ElementLowerContext } from "../../../parameters/context";
import { setField } from "../../../setField";
import { lowerVehicleSet } from "../vehicle_set";
import { lowerWeaponSet } from "../weapon_set";
import { resolveSimpleBoolean, resolveSimpleNumber } from "./helpers";

/** Returns true if `optionName` was handled as a map override. */
export const tryLowerMapOverride = (
  optionName: string,
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
): boolean => {
  const { diagnostics, ir, symbolTable } = ctx;
  const map = ir.gameVariant.baseVariant.mapOverrideOptions;

  switch (optionName) {
    case "grenades_on_map": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "grenadesOnMap",
        value.value,
        value.location
      );
      return true;
    }
    case "shortcuts_on_map": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "shortcutsOnMap",
        value.value,
        value.location
      );
      return true;
    }
    case "equipment_on_map": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "equipmentOnMap",
        value.value,
        value.location
      );
      return true;
    }
    case "powerups_on_map": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "powerupsOnMap",
        value.value,
        value.location
      );
      return true;
    }
    case "turrets_on_map": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "turretsOnMap",
        value.value,
        value.location
      );
      return true;
    }
    case "indestructible_vehicles": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "indestructibleVehicles",
        value.value,
        value.location
      );
      return true;
    }
    case "red_powerup_duration": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "redPowerupDurationSeconds",
        value.value,
        value.location
      );
      return true;
    }
    case "blue_powerup_duration": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "bluePowerupDurationSeconds",
        value.value,
        value.location
      );
      return true;
    }
    case "yellow_powerup_duration": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        map,
        "yellowPowerupDurationSeconds",
        value.value,
        value.location
      );
      return true;
    }
    case "weapon_set": {
      const value = lowerWeaponSet(entry.value, symbolTable);
      setField(
        ir.locations,
        diagnostics,
        map,
        "weaponSetAbsoluteIndex",
        value.value,
        value.location
      );
      return true;
    }
    case "vehicle_set": {
      const value = lowerVehicleSet(entry.value, symbolTable);
      setField(
        ir.locations,
        diagnostics,
        map,
        "vehicleSetAbsoluteIndex",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
