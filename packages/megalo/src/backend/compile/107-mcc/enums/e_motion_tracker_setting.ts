import { e_motion_tracker_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { MotionTrackerMode } from "src/frontend/intermediate-representation/game/game_engine_player_traits";

export const encodeMotionTrackerSetting = (
  value: MotionTrackerMode
): e_motion_tracker_setting => {
  switch (value) {
    case MotionTrackerMode.Unchanged:
      return e_motion_tracker_setting.unchanged;
    case MotionTrackerMode.Off:
      return e_motion_tracker_setting.off;
    case MotionTrackerMode.Allies:
      return e_motion_tracker_setting.allies;
    case MotionTrackerMode.Normal:
      return e_motion_tracker_setting.normal;
    case MotionTrackerMode.Enhanced:
      return e_motion_tracker_setting.enhanced;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
