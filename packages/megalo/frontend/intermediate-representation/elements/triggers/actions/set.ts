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
import {
  coerceVariantOperands,
  isBareNoneOperand,
} from "../../../parameters/references/coerce";
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

  const leftWasNone = isBareNoneOperand(leftNode);
  const rightWasNone = isBareNoneOperand(rightNode);
  const [left, right] = coerceVariantOperands(
    resolveVariantVariable(leftNode, paramCtx),
    resolveVariantVariable(rightNode, paramCtx),
    rightWasNone,
    leftWasNone
  );

  return {
    type: ActionType.Set,
    parameters: {
      left,
      operation: parseMathOperation(operationNode, location),
      right,
    },
  };
};
