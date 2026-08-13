import { e_active_camo_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ActiveCamo } from "../../../../frontend/intermediate-representation/game/game_engine_player_traits";

export const encodeActiveCamoSetting = (
  value: ActiveCamo
): e_active_camo_setting => {
  switch (value) {
    case ActiveCamo.Off:
      return e_active_camo_setting.off;
    case ActiveCamo.On:
      return e_active_camo_setting.on;
    case ActiveCamo.Poor:
      return e_active_camo_setting.poor;
    case ActiveCamo.Good:
      return e_active_camo_setting.good;
    case ActiveCamo.Excellent:
      return e_active_camo_setting.excellent;
    case ActiveCamo.Invisible:
      return e_active_camo_setting.invisible;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
