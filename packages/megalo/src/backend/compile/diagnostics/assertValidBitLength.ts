import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { BUILT_IN_LOCATION } from "src/diagnostics";

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
  value: number,
  bitLength: number,
  signed: boolean,
  diagnostics: Diagnostics,
  location: SourceLocation = BUILT_IN_LOCATION
): void {
  if (!isWithinBitLength(value, bitLength, signed)) {
    // TODO: Add a more specific error message.
    diagnostics.addError(
      `Value ${value} is out of range for bit length ${bitLength}.`,
      location
    );
  }
}
