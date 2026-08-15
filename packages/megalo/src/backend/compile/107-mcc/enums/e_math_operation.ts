import { e_math_operation } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  MathOperation,
  type MathOperation as MathOperationName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const MATH_OPERATION_TO_BLF = {
  [MathOperation.add]: e_math_operation.add,
  [MathOperation.subtract]: e_math_operation.subtract,
  [MathOperation.multiply]: e_math_operation.multiply,
  [MathOperation.divide]: e_math_operation.divide,
  [MathOperation.set_to]: e_math_operation.set_to,
  [MathOperation.modulo]: e_math_operation.modulo,
  [MathOperation.and]: e_math_operation.and,
  [MathOperation.or]: e_math_operation.or,
  [MathOperation.xor]: e_math_operation.xor,
  [MathOperation.not]: e_math_operation.not,
  [MathOperation.lshift]: e_math_operation.lshift,
  [MathOperation.rshift]: e_math_operation.rshift,
  [MathOperation.abs]: e_math_operation.abs,
} as const satisfies Record<MathOperationName, e_math_operation>;

export const encodeMathOperation = (
  value: MathOperationName
): e_math_operation => mapMegaloEnum(value, MATH_OPERATION_TO_BLF);
