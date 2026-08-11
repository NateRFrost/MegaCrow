import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type ElementLowerContext } from "../../../parameters/context";
import { requireParamCount } from "../helpers";

const parseBooleanLiteral = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): boolean => {
  if (node.kind === SyntaxKind.KEYWORD) {
    if (node.value === "true" || node.value === "1") return true;
    if (node.value === "false" || node.value === "0") return false;
  }
  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return node.value !== 0;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("boolean", ""),
    node.location ?? location,
  );
};

export const lowerDebuggingEnableTracing = (
  parameters: ASTParameterNode[],
  _ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 1, location);
  return {
    type: ActionType.DebuggingEnableTracing,
    parameters: {
      tracingEnabled: parseBooleanLiteral(parameters[0]!, location),
    },
  };
};
