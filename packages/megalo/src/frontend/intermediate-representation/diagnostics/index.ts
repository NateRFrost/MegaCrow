import type { Diagnostics } from "src/diagnostics";
import { LowerError } from "src/frontend/intermediate-representation/error";

export const dxAssertionScope = (
  diagnostics: Diagnostics,
  func: () => void
) => {
  try {
    func();
  } catch (error) {
    if (error instanceof LowerError) {
      diagnostics.addError(error.message, error.location);
    } else {
      throw error;
    }
  }
};
