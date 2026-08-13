import type { Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";

export const assertParameterCount = (
  count: number,
  parameters: ASTParameterNode[],
  diagnostics: Diagnostics
): boolean => {
  if (parameters.length > count) {
    // error spans over all extra parameters
    const location = parameters
      .slice(count)
      .reduce(
        (acc, param) => locationSpan(acc, param.location),
        parameters[0].location
      );
    diagnostics.addError(
      diagnosticMessages.invalidParameterCount(count, parameters.length),
      location
    );
    return false;
  }
  if (parameters.length < count) {
    // error spans over all parameters
    const location = parameters.reduce(
      (acc, param) => locationSpan(acc, param.location),
      parameters[0].location
    );
    diagnostics.addError(
      diagnosticMessages.invalidParameterCount(count, parameters.length),
      location
    );
    return false;
  }
  return true;
};
