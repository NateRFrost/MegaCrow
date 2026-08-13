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
  tryLowerConstantInteger,
} from "src/frontend/intermediate-representation/parameters";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

/** MegaloEdit `s_object_offset`: three `ReadConstantInteger` values. */
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
      if (parameter.value === "absolute_orientation") {
        absoluteOrientation = true;
        index++;
        continue;
      }
    }

    // Positional x y z (no `offset` keyword) — same ReadConstantInteger triple.
    const yNode = parameters[index + 1];
    const zNode = parameters[index + 2];
    if (
      yNode !== undefined &&
      zNode !== undefined &&
      tryLowerConstantInteger(parameter, ctx) !== undefined &&
      tryLowerConstantInteger(yNode, ctx) !== undefined &&
      tryLowerConstantInteger(zNode, ctx) !== undefined
    ) {
      offset = {
        x: resolveOffsetComponent(parameter, ctx, location),
        y: resolveOffsetComponent(yNode, ctx, location),
        z: resolveOffsetComponent(zNode, ctx, location),
      };
      index += 3;
      continue;
    }

    break;
  }

  return { offset, absoluteOrientation, nextIndex: index };
};

export const lowerObjectAttach = (
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
  const { offset, absoluteOrientation, nextIndex } = parseOptionalObjectOffset(
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
    type: ActionType.ObjectAttach,
    parameters: {
      child: resolveObjectReference(parameters[0]!, paramCtx),
      parent: resolveObjectReference(parameters[1]!, paramCtx),
      offset,
      ...(absoluteOrientation === undefined ? {} : { absoluteOrientation }),
    },
  };
};
