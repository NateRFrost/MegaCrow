import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const lowerEndRound = (
  parameters: ASTParameterNode[],
  _ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length !== 0) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(0, parameters.length),
      location
    );
  }
  return {
    type: ActionType.EndRound,
    parameters: undefined as never,
  };
};
