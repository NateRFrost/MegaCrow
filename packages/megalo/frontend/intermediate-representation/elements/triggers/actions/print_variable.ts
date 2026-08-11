import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "../../../parameters/context";
import { lowerDynamicString } from "../dynamicString";

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
