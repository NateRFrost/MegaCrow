import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActiveCamo,
  ForcedChangeColor,
  type PlayerTraits,
  WaypointVisibility,
} from "../../../game/game_engine_player_traits";
import { setField } from "../../../setField";
import { resolveEnumKeyword, type TraitOptionArgs } from "./helpers";

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

/** Returns true if `identifier` was handled as an appearance trait. */
export const lowerAppearanceOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { parameters, first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "active_camo": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("active_camo", ""),
          location
        );
      }
      const value = resolveEnumKeyword(first, ACTIVE_CAMO, "active_camo");
      setField(
        ir.locations,
        diagnostics,
        traits.appearance,
        "activeCamo",
        value.value,
        value.location
      );
      return true;
    }
    case "waypoint": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("waypoint", ""),
          location
        );
      }
      const value = resolveEnumKeyword(first, WAYPOINT, "waypoint");
      setField(
        ir.locations,
        diagnostics,
        traits.appearance,
        "waypoint",
        value.value,
        value.location
      );
      return true;
    }
    case "gamertag_visibility": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("waypoint", ""),
          location
        );
      }
      const value = resolveEnumKeyword(first, WAYPOINT, "waypoint");
      setField(
        ir.locations,
        diagnostics,
        traits.appearance,
        "gamertag",
        value.value,
        value.location
      );
      return true;
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
      const value = resolveEnumKeyword(first, FORCED_COLOR, "color");
      setField(
        ir.locations,
        diagnostics,
        traits.appearance,
        "forcedChangeColor",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
