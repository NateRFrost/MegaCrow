import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
  type ObjectOffset,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveObjectReference } from "../../../parameters";

const resolveNumericLiteral = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): number => {
  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return node.value;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("number", ""),
    node.location ?? location,
  );
};

const parseOptionalObjectOffset = (
  parameters: ASTParameterNode[],
  startIndex: number,
  location: SourceCodeLocation,
): {
  offset: ObjectOffset;
  absoluteOrientation?: boolean;
  nextIndex: number;
} => {
  let offset: ObjectOffset = { x: 0, y: 0, z: 0 };
  let absoluteOrientation: boolean | undefined;
  let index = startIndex;

  while (index < parameters.length) {
    const parameter = parameters[index]!;
    if (parameter.kind === SyntaxKind.KEYWORD) {
      if (parameter.value === "offset") {
        const xNode = parameters[index + 1];
        const yNode = parameters[index + 2];
        const zNode = parameters[index + 3];
        if (xNode === undefined || yNode === undefined || zNode === undefined) {
          throw new LowerError(
            diagnosticMessages.invalidParameterCount(
              index + 4,
              parameters.length,
            ),
            location,
          );
        }
        offset = {
          x: resolveNumericLiteral(xNode, location),
          y: resolveNumericLiteral(yNode, location),
          z: resolveNumericLiteral(zNode, location),
        };
        index += 4;
        continue;
      }
      if (parameter.value === "absolute_orientation") {
        absoluteOrientation = true;
        index++;
        continue;
      }
    }

    if (
      parameter.kind === SyntaxKind.INTEGER ||
      parameter.kind === SyntaxKind.FLOATING_POINT
    ) {
      const yNode = parameters[index + 1];
      const zNode = parameters[index + 2];
      if (
        yNode !== undefined &&
        zNode !== undefined &&
        (yNode.kind === SyntaxKind.INTEGER ||
          yNode.kind === SyntaxKind.FLOATING_POINT) &&
        (zNode.kind === SyntaxKind.INTEGER ||
          zNode.kind === SyntaxKind.FLOATING_POINT)
      ) {
        offset = {
          x: parameter.value,
          y: yNode.value,
          z: zNode.value,
        };
        index += 3;
        continue;
      }
    }

    break;
  }

  return { offset, absoluteOrientation, nextIndex: index };
};

export const lowerObjectFaceObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const { offset, nextIndex } = parseOptionalObjectOffset(
    parameters,
    2,
    location,
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location,
    );
  }
  return {
    type: ActionType.ObjectFaceObject,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      target: resolveObjectReference(parameters[1]!, paramCtx),
      ...(offset.x !== 0 || offset.y !== 0 || offset.z !== 0 ? { offset } : {}),
    },
  };
};
