import { diagnosticMessages } from "src/diagnostics/messages";
import {
  resolveEnumKeyword,
  resolveKeyword,
  type TraitOptionArgs,
} from "src/frontend/intermediate-representation/elements/game_options/player_traits/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type PlayerTraits,
  VehicleUsage,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { lowerConstantInteger } from "src/frontend/intermediate-representation/parameters";
import { setField } from "src/frontend/intermediate-representation/setField";

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

/** Returns true if `identifier` was handled as a movement trait. */
export const lowerMovementOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "speed": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.movement,
        "speedPercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "gravity": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.movement,
        "gravityPercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "vehicle_usage": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("vehicle_usage", ""),
          location
        );
      }
      const value = resolveEnumKeyword(first, VEHICLE_USAGE, "vehicle_usage");
      setField(
        ir.locations,
        diagnostics,
        traits.movement,
        "vehicleUsage",
        value.value,
        value.location
      );
      return true;
    }
    case "jump_modifier": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("integer", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "integer", location);
      setField(
        ir.locations,
        diagnostics,
        traits.movement,
        "jumpModifier",
        value.value,
        value.location
      );
      return true;
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
            diagnosticMessages.expectedParameterType("sprinting", name ?? ""),
            first.location
          );
      }
      setField(
        ir.locations,
        diagnostics,
        traits.movement,
        "sprinting",
        enabled,
        first.location
      );
      return true;
    }
    default:
      return false;
  }
};
