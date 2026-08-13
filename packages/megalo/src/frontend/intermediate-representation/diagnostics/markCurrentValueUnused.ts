import type { Diagnostics, SourceLocation } from "../../../diagnostics";
import { SourceLocationType } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";

/**
 * When an IR field already has a value and is overwritten, mark that current
 * (displaced) value unused. Built-in defaults are ignored.
 */
export const markCurrentValueUnused = (
  location: SourceLocation | undefined,
  diagnostics: Diagnostics
): void => {
  if (location === undefined || location.type === SourceLocationType.BUILT_IN) {
    return;
  }
  diagnostics.addWarning(
    diagnosticMessages.unusedValue(location),
    location
  );
};
