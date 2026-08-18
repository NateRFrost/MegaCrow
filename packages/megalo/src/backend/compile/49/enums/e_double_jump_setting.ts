import {
  DoubleJump,
  type DoubleJump as DoubleJumpName,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

/** Alpha / Beta: 2-bit integer (unchanged=0, off=1, on=2, triple=3). */
const DOUBLE_JUMP_TO_WIRE = {
  [DoubleJump.disabled]: 1,
  [DoubleJump.enabled]: 2,
  [DoubleJump.triple]: 3,
} as const satisfies Record<DoubleJumpName, number>;

export const encodeDoubleJumpSetting = (value: DoubleJumpName): number =>
  mapMegaloEnum(value, DOUBLE_JUMP_TO_WIRE);
