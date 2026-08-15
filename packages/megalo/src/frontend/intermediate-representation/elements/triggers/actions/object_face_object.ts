import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  type ObjectOffset,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  lowerConstantInteger,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const resolveOffsetComponent = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => lowerConstantInteger(node, ctx, "integer", location).value;

const parseOptionalObjectOffset = (
  parameters: ASTParameterNode[],
  startIndex: number,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): {
  offset: ObjectOffset;
  nextIndex: number;
} => {
  let offset: ObjectOffset = { x: 0, y: 0, z: 0 };
  let index = startIndex;

  while (index < parameters.length) {
    const parameter = parameters[index]!;
    if (parameter.kind === SyntaxKind.KEYWORD && parameter.value === "offset") {
      const xNode = parameters[index + 1];
      const yNode = parameters[index + 2];
      const zNode = parameters[index + 3];
      if (xNode === undefined || yNode === undefined || zNode === undefined) {
        throw new LowerError(
          diagnosticMessages.invalidParameterCount(
            index + 4,
            parameters.length
          ),
          location
        );
      }
      offset = {
        x: resolveOffsetComponent(xNode, ctx, location),
        y: resolveOffsetComponent(yNode, ctx, location),
        z: resolveOffsetComponent(zNode, ctx, location),
      };
      index += 4;
      continue;
    }

    break;
  }

  return { offset, nextIndex: index };
};

export const lowerObjectFaceObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const paramCtx = asParameterLoweringContext(ctx);
  const { offset, nextIndex } = parseOptionalObjectOffset(
    parameters,
    2,
    ctx,
    location
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location
    );
  }
  return {
    type: ActionType.object_face_object,
    parameters: {
      object: resolveObjectReference(parameters[0]!, paramCtx),
      target: resolveObjectReference(parameters[1]!, paramCtx),
      ...(offset.x !== 0 || offset.y !== 0 || offset.z !== 0 ? { offset } : {}),
    },
  };
};
