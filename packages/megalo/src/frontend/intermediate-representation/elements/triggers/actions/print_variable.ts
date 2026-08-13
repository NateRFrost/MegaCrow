import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const lowerPrintVariable = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 1 || parameters[0] === undefined) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(1, parameters.length),
      location
    );
  }
  return {
    type: ActionType.PrintVariable,
    parameters: {
      string: lowerDynamicString(parameters[0], ctx),
    },
  };
};
