import { e_motion_tracker_setting } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  MotionTrackerMode,
  type MotionTrackerMode as MotionTrackerModeName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const MOTION_TRACKER_MODE_TO_BLF = {
  [MotionTrackerMode.unchanged]: e_motion_tracker_setting.unchanged,
  [MotionTrackerMode.off]: e_motion_tracker_setting.off,
  [MotionTrackerMode.allies]: e_motion_tracker_setting.allies,
  [MotionTrackerMode.normal]: e_motion_tracker_setting.normal,
  [MotionTrackerMode.enhanced]: e_motion_tracker_setting.enhanced,
} as const satisfies Record<MotionTrackerModeName, e_motion_tracker_setting>;

export const encodeMotionTrackerSetting = (
  value: MotionTrackerModeName
): e_motion_tracker_setting => mapMegaloEnum(value, MOTION_TRACKER_MODE_TO_BLF);
