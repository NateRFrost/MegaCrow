import { diagnosticMessages } from "src/diagnostics/messages";
import {
  resolveEnumKeyword,
  type TraitOptionArgs,
} from "src/frontend/intermediate-representation/elements/game_options/player_traits/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActiveCamo,
  ForcedChangeColor,
  type PlayerTraits,
  WaypointVisibility,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { setField } from "src/frontend/intermediate-representation/setField";

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
      const value = resolveEnumKeyword(first, ActiveCamo, "active_camo");
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
      const value = resolveEnumKeyword(first, WaypointVisibility, "waypoint");
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
      const value = resolveEnumKeyword(first, WaypointVisibility, "waypoint");
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
      const value = resolveEnumKeyword(first, ForcedChangeColor, "color");
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
