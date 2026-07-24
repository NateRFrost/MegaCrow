import { e_waypoint_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { WaypointVisibility } from "../../../intermediate-representation/game/game_engine_player_traits";

export const encodeWaypointSetting = (
  value: WaypointVisibility
): e_waypoint_setting => {
  switch (value) {
    case WaypointVisibility.Unchanged:
      return e_waypoint_setting.unchanged;
    case WaypointVisibility.Off:
      return e_waypoint_setting.off;
    case WaypointVisibility.Allies:
      return e_waypoint_setting.allies;
    case WaypointVisibility.All:
      return e_waypoint_setting.all;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
