import { e_grenade_count_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { GrenadeCountSetting } from "../../../intermediate-representation/game/game_engine_player_traits";

export const encodeGrenadeCountSetting = (
  value: GrenadeCountSetting
): e_grenade_count_setting => {
  switch (value) {
    case GrenadeCountSetting.None:
      return e_grenade_count_setting.none;
    case GrenadeCountSetting.Default:
      return e_grenade_count_setting.map_default;
    case GrenadeCountSetting.Zero:
      return e_grenade_count_setting.zero;
    case GrenadeCountSetting.Frag1:
      return e_grenade_count_setting.frag_1;
    case GrenadeCountSetting.Frag2:
      return e_grenade_count_setting.frag_2;
    case GrenadeCountSetting.Frag3:
      return e_grenade_count_setting.frag_3;
    case GrenadeCountSetting.Frag4:
      return e_grenade_count_setting.frag_4;
    case GrenadeCountSetting.Plasma1:
      return e_grenade_count_setting.plasma_1;
    case GrenadeCountSetting.Plasma2:
      return e_grenade_count_setting.plasma_2;
    case GrenadeCountSetting.Plasma3:
      return e_grenade_count_setting.plasma_3;
    case GrenadeCountSetting.Plasma4:
      return e_grenade_count_setting.plasma_4;
    case GrenadeCountSetting.Each1:
      return e_grenade_count_setting.each_1;
    case GrenadeCountSetting.Each2:
      return e_grenade_count_setting.each_2;
    case GrenadeCountSetting.Each3:
      return e_grenade_count_setting.each_3;
    case GrenadeCountSetting.Each4:
      return e_grenade_count_setting.each_4;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
