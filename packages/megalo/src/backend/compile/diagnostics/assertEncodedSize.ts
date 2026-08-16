import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

/**
 * Post-encode check: fail when the compiled variant exceeds the version's
 * storage budget ({@link Limits.encodedSize}).
 * No-op when `maxBytes` is 0 (limit unused for that version).
 */
export const assertEncodedSize = (
  encodedBytes: number,
  maxBytes: number,
  diagnostics: Diagnostics
): void => {
  if (maxBytes <= 0 || encodedBytes <= maxBytes) {
    return;
  }
  diagnostics.addError(
    diagnosticMessages.variantEncodedTooLarge(encodedBytes, maxBytes),
    BUILT_IN_LOCATION
  );
};
