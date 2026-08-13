import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";

export const lowerPrintVariable = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length !== 1 || parameters[0] === undefined) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(1, parameters.length),
      location,
    );
  }
  return {
    type: ActionType.PrintVariable,
    parameters: {
      string: lowerDynamicString(parameters[0], ctx),
    },
  };
};
