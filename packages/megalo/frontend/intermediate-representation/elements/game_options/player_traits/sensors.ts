import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  MotionTrackerMode,
  type PlayerTraits,
} from "../../../game/game_engine_player_traits";
import { lowerNumberParam } from "../../../parameters";
import { setField } from "../../../setField";
import { resolveEnumKeyword, type TraitOptionArgs } from "./helpers";

const MOTION_TRACKER: Record<string, MotionTrackerMode> = {
  unchanged: MotionTrackerMode.Unchanged,
  off: MotionTrackerMode.Off,
  allies: MotionTrackerMode.Allies,
  normal: MotionTrackerMode.Normal,
  enhanced: MotionTrackerMode.Enhanced,
};

/** Returns true if `identifier` was handled as a sensors trait. */
export const lowerSensorsOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { parameters, first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "tracker_mode": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("tracker_mode", ""),
          location
        );
      }
      const value = resolveEnumKeyword(first, MOTION_TRACKER, "tracker_mode");
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
      const value = lowerNumberParam(parameters, ctx, "percentage", location);
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
