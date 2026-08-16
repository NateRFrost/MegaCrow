import { e_math_operation } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  MathOperation,
  type MathOperation as MathOperationName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";

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
  [MathOperation.abs]: e_math_operation.abs,
} as const satisfies Partial<Record<MathOperationName, e_math_operation>>;

export const encodeMathOperation = (
  value: MathOperationName
): e_math_operation => {
  const mapped = (
    MATH_OPERATION_TO_BLF as Partial<
      Record<
        string,
        (typeof MATH_OPERATION_TO_BLF)[keyof typeof MATH_OPERATION_TO_BLF]
      >
    >
  )[value as string];
  if (mapped === undefined) {
    throw new Error(`Math operation ${value} is not supported on this version`);
  }
  return mapped;
};
