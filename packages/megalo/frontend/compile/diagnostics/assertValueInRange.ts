import type { Diagnostics, SourceLocation } from "../../diagnostics";
import { BUILT_IN_LOCATION } from "../../diagnostics";

export const isWithinRange = (
  value: number,
  min: number,
  max: number
): boolean => value >= min && value <= max;

export function assertValueInRange(
  value: number,
  min: number,
  max: number,
  diagnostics: Diagnostics,
  location: SourceLocation = BUILT_IN_LOCATION
): void {
  if (!isWithinRange(value, min, max)) {
    // TODO: Add a more specific error message.
    diagnostics.addError(
      `Value ${value} is out of range for range ${min} to ${max}.`,
      location
    );
  }
}
