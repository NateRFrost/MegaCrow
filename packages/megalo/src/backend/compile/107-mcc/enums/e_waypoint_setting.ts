import { e_waypoint_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  WaypointVisibility,
  type WaypointVisibility as WaypointVisibilityName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";

const WAYPOINT_VISIBILITY_TO_BLF = {
  [WaypointVisibility.unchanged]: e_waypoint_setting.unchanged,
  [WaypointVisibility.off]: e_waypoint_setting.off,
  [WaypointVisibility.allies]: e_waypoint_setting.allies,
  [WaypointVisibility.all]: e_waypoint_setting.all,
} as const satisfies Record<WaypointVisibilityName, e_waypoint_setting>;

export const encodeWaypointSetting = (
  value: WaypointVisibilityName
): e_waypoint_setting => mapMegaloEnum(value, WAYPOINT_VISIBILITY_TO_BLF);
