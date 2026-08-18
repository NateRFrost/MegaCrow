import { e_double_jump_setting } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import {
  DoubleJump,
  type DoubleJump as DoubleJumpName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const DOUBLE_JUMP_TO_BLF = {
  [DoubleJump.disabled]: e_double_jump_setting.off,
  [DoubleJump.enabled]: e_double_jump_setting.on,
  [DoubleJump.triple]: e_double_jump_setting.triple,
} as const satisfies Record<DoubleJumpName, e_double_jump_setting>;

export const encodeDoubleJumpSetting = (
  value: DoubleJumpName
): e_double_jump_setting => mapMegaloEnum(value, DOUBLE_JUMP_TO_BLF);
