import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { requireKeyword, requireParamCount } from "src/frontend/intermediate-representation/elements/triggers/helpers";

const parseFunctionNameIndex = (
  node: ASTParameterNode,

  location: SourceCodeLocation,
): number => {
  const name = requireKeyword(node, location);

  if (/^\d+$/.test(name)) {
    return Number(name);
  }

  // TODO: resolve hs function name via object_lists/stringids.txt lookup.

  throw new LowerError(
    diagnosticMessages.expectedParameterType("hs function name index", name),

    node.location ?? location,
  );
};

export const lowerHsFunctionCall = (
  parameters: ASTParameterNode[],

  _ctx: ElementLowerContext,

  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 1, location);

  return {
    type: ActionType.HsFunctionCall,

    parameters: {
      functionNameIndex: parseFunctionNameIndex(parameters[0]!, location),
    },
  };
};
