import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveVariantVariable } from "../../../parameters";
import { parseMathOperation, requireParamCount } from "../helpers";

export const lowerSet = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  requireParamCount(parameters, 3, location);
  const leftNode = parameters[0]!;
  const operationNode = parameters[1]!;
  const rightNode = parameters[2]!;
  const paramCtx = asParameterLoweringContext(ctx);

  return {
    type: ActionType.Set,
    parameters: {
      left: resolveVariantVariable(leftNode, paramCtx),
      operation: parseMathOperation(operationNode, location),
      right: resolveVariantVariable(rightNode, paramCtx),
    },
  };
};
