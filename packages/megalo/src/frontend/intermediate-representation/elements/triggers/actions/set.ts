import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { assertWritableVariant } from "src/frontend/intermediate-representation/diagnostics";
import {
  parseMathOperation,
  requireParamCount,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { resolveVariantVariable } from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  coerceVariantOperands,
  isBareNoneOperand,
} from "src/frontend/intermediate-representation/parameters/references/coerce";

export const lowerSet = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
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
  assertWritableVariant(left, leftNode.location);

  return {
    type: ActionType.set,
    parameters: {
      left,
      operation: parseMathOperation(operationNode, location),
      right,
    },
  };
};
