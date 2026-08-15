import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

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
  diagnostics.addWarning(
    diagnosticMessages.unusedValue(name, overriddenAt),
    previousLocation
  );
};
