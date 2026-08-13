import { e_infinite_ammo_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { InfiniteAmmoSetting } from "src/frontend/intermediate-representation/game/game_engine_player_traits";

export const encodeInfiniteAmmoSetting = (
  value: InfiniteAmmoSetting
): e_infinite_ammo_setting => {
  switch (value) {
    case InfiniteAmmoSetting.Unchanged:
      return e_infinite_ammo_setting.unchanged;
    case InfiniteAmmoSetting.Disabled:
      return e_infinite_ammo_setting.disabled;
    case InfiniteAmmoSetting.Enabled:
      return e_infinite_ammo_setting.enabled;
    case InfiniteAmmoSetting.BottomlessClip:
      return e_infinite_ammo_setting.bottomless_clip;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
