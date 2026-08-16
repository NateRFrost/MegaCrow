import { e_grenade_count_setting } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  GrenadeCountSetting,
  type GrenadeCountSetting as GrenadeCountSettingName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

/** Script `none` → BLF `none`; omit the IR field for BLF `unchanged`. */
const GRENADE_COUNT_SETTING_TO_BLF = {
  [GrenadeCountSetting.none]: e_grenade_count_setting.none,
  [GrenadeCountSetting.default]: e_grenade_count_setting.map_default,
  [GrenadeCountSetting["1 frag"]]: e_grenade_count_setting.frag_1,
  [GrenadeCountSetting["2 frag"]]: e_grenade_count_setting.frag_2,
  [GrenadeCountSetting["3 frag"]]: e_grenade_count_setting.frag_3,
  [GrenadeCountSetting["4 frag"]]: e_grenade_count_setting.frag_4,
  [GrenadeCountSetting["1 plasma"]]: e_grenade_count_setting.plasma_1,
  [GrenadeCountSetting["2 plasma"]]: e_grenade_count_setting.plasma_2,
  [GrenadeCountSetting["3 plasma"]]: e_grenade_count_setting.plasma_3,
  [GrenadeCountSetting["4 plasma"]]: e_grenade_count_setting.plasma_4,
  [GrenadeCountSetting["1 each"]]: e_grenade_count_setting.each_1,
  [GrenadeCountSetting["2 each"]]: e_grenade_count_setting.each_2,
  [GrenadeCountSetting["3 each"]]: e_grenade_count_setting.each_3,
  [GrenadeCountSetting["4 each"]]: e_grenade_count_setting.each_4,
} as const satisfies Record<GrenadeCountSettingName, e_grenade_count_setting>;

export const encodeGrenadeCountSetting = (
  value: GrenadeCountSettingName
): e_grenade_count_setting =>
  mapMegaloEnum(value, GRENADE_COUNT_SETTING_TO_BLF);
