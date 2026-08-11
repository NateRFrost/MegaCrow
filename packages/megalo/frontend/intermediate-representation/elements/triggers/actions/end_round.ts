import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "../../../parameters/context";

export const lowerEndRound = (
  parameters: ASTParameterNode[],
  _ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length !== 0) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(0, parameters.length),
      location,
    );
  }
  return {
    type: ActionType.EndRound,
    parameters: undefined as never,
  };
};
