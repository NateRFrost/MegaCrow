import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

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
