import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "../../../parameters/context";
import { requireKeyword, requireParamCount } from "../helpers";

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
