import { e_forced_change_color_setting } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ForcedChangeColor } from "../../../../frontend/intermediate-representation/game/game_engine_player_traits";

export const encodeForcedChangeColorSetting = (
  value: ForcedChangeColor
): e_forced_change_color_setting => {
  switch (value) {
    case ForcedChangeColor.Unchanged:
      return e_forced_change_color_setting.unchanged;
    case ForcedChangeColor.Off:
      return e_forced_change_color_setting.off;
    case ForcedChangeColor.Red:
      return e_forced_change_color_setting.red;
    case ForcedChangeColor.Blue:
      return e_forced_change_color_setting.blue;
    case ForcedChangeColor.Green:
      return e_forced_change_color_setting.green;
    case ForcedChangeColor.Yellow:
      return e_forced_change_color_setting.yellow;
    case ForcedChangeColor.Purple:
      return e_forced_change_color_setting.purple;
    case ForcedChangeColor.Orange:
      return e_forced_change_color_setting.orange;
    case ForcedChangeColor.Brown:
      return e_forced_change_color_setting.brown;
    case ForcedChangeColor.Pink:
      return e_forced_change_color_setting.pink;
    case ForcedChangeColor.White:
      return e_forced_change_color_setting.white;
    case ForcedChangeColor.Black:
      return e_forced_change_color_setting.black;
    case ForcedChangeColor.Zombie:
      return e_forced_change_color_setting.zombie;
    case ForcedChangeColor.Extra4:
      return e_forced_change_color_setting.extra4;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
