import type { Diagnostics } from "../../diagnostics";
import type { ValueWithLocation } from "../../intermediate-representation";

export const isWithinBitLength = (
  value: number,
  bitLength: number,
  signed: boolean
): boolean => {
  if (signed) {
    const max = 1 << (bitLength - 1);
    return value >= -max && value < max;
  }
  return value >= 0 && value < 1 << bitLength;
};

export function assertValidBitLength(
  value: ValueWithLocation<number>,
  bitLength: number,
  signed: boolean,
  diagnostics: Diagnostics
): void {
  if (!isWithinBitLength(value.value, bitLength, signed)) {
    // TODO: Add a more specific error message.
    diagnostics.addError(
      `Value ${value.value} is out of range for bit length ${bitLength}.`,
      value.location
    );
  }
}
