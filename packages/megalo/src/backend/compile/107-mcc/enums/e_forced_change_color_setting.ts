import { e_forced_change_color_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  ForcedChangeColor,
  type ForcedChangeColor as ForcedChangeColorName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";

const FORCED_CHANGE_COLOR_TO_BLF = {
  [ForcedChangeColor.unchanged]: e_forced_change_color_setting.unchanged,
  [ForcedChangeColor.off]: e_forced_change_color_setting.off,
  [ForcedChangeColor.red]: e_forced_change_color_setting.red,
  [ForcedChangeColor.blue]: e_forced_change_color_setting.blue,
  [ForcedChangeColor.green]: e_forced_change_color_setting.green,
  [ForcedChangeColor.yellow]: e_forced_change_color_setting.yellow,
  [ForcedChangeColor.purple]: e_forced_change_color_setting.purple,
  [ForcedChangeColor.orange]: e_forced_change_color_setting.orange,
  [ForcedChangeColor.brown]: e_forced_change_color_setting.brown,
  [ForcedChangeColor.pink]: e_forced_change_color_setting.pink,
  [ForcedChangeColor.white]: e_forced_change_color_setting.white,
  [ForcedChangeColor.black]: e_forced_change_color_setting.black,
  [ForcedChangeColor.zombie]: e_forced_change_color_setting.zombie,
  [ForcedChangeColor.extra4]: e_forced_change_color_setting.extra4,
} as const satisfies Record<
  ForcedChangeColorName,
  e_forced_change_color_setting
>;

export const encodeForcedChangeColorSetting = (
  value: ForcedChangeColorName
): e_forced_change_color_setting =>
  mapMegaloEnum(value, FORCED_CHANGE_COLOR_TO_BLF);
