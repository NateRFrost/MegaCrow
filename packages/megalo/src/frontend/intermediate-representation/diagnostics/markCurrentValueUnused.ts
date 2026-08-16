import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { isSourceCodeLocation, SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

const isIncludeLocation = (location: SourceLocation): boolean => {
  if (location.type === SourceLocationType.INCLUDE) {
    return true;
  }
  return isSourceCodeLocation(location) && location.include !== undefined;
};

export const markCurrentValueUnused = (
  previousLocation: SourceLocation | undefined,
  diagnostics: Diagnostics,
  overriddenAt: SourceLocation,
  name: string
): void => {
  if (
    previousLocation === undefined ||
    previousLocation.type === SourceLocationType.BUILT_IN ||
    previousLocation.type === SourceLocationType.UNKNOWN
  ) {
    return;
  }

  // Overriding a value that came from an include is intentional — don't warn.
  if (isIncludeLocation(previousLocation)) {
    return;
  }

  diagnostics.addWarning(
    diagnosticMessages.unusedValue(name, overriddenAt),
    previousLocation
  );
};
