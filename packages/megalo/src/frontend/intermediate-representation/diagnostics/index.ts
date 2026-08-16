import type { Diagnostics } from "src/diagnostics";
import { LowerError } from "src/frontend/intermediate-representation/error";

export { assertPreGameActions } from "src/frontend/intermediate-representation/diagnostics/assertPreGameActions";
export {
  assertWritableNumeric,
  assertWritableObject,
  assertWritablePlayer,
  assertWritableTeam,
  assertWritableTimer,
  assertWritableVariant,
} from "src/frontend/intermediate-representation/diagnostics/assertWritable";

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
