import type { e_math_operation } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { MathOperation } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";

export const encodeMathOperation = (value: MathOperation): e_math_operation =>
  value as unknown as e_math_operation;
