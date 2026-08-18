import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

/**
 * Fail when script string table UTF-8 (+ NUL) bytes exceed the version's
 * {@link Limits.stringBytes} budget.
 * No-op when `maxBytes` is 0 (limit unused for that version).
 */
export const assertScriptStringBytes = (
  usedBytes: number,
  maxBytes: number,
  diagnostics: Diagnostics
): void => {
  if (maxBytes <= 0 || usedBytes <= maxBytes) {
    return;
  }
  diagnostics.addError(
    diagnosticMessages.scriptStringBytesTooLarge(usedBytes, maxBytes),
    BUILT_IN_LOCATION
  );
};
