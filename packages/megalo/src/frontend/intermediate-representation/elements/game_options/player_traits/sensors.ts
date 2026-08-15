import { diagnosticMessages } from "src/diagnostics/messages";
import {
  resolveEnumKeyword,
  type TraitOptionArgs,
} from "src/frontend/intermediate-representation/elements/game_options/player_traits/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  MotionTrackerMode,
  type PlayerTraits,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { lowerConstantInteger } from "src/frontend/intermediate-representation/parameters";
import { setField } from "src/frontend/intermediate-representation/setField";

/** Returns true if `identifier` was handled as a sensors trait. */
export const lowerSensorsOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "tracker_mode": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("tracker_mode", ""),
          location
        );
      }
      const value = resolveEnumKeyword(
        first,
        MotionTrackerMode,
        "tracker_mode"
      );
      setField(
        ir.locations,
        diagnostics,
        traits.sensors,
        "motionTrackerMode",
        value.value,
        value.location
      );
      return true;
    }
    case "tracker_range": {
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
        traits.sensors,
        "motionTrackerRange",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
