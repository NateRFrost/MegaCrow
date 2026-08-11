import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  BoundaryShape,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { type CustomVariableReference } from "../../../game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "../../../parameters";
import { requireKeyword } from "../helpers";

const parseBoundaryShape = (
  node: ASTParameterNode,
  location: SourceCodeLocation,
): BoundaryShape => {
  const name = requireKeyword(node, location).toLowerCase();
  switch (name) {
    case "sphere":
      return BoundaryShape.Sphere;
    case "box":
      return BoundaryShape.Box;
    case "cylinder":
      return BoundaryShape.Cylinder;
    case "none":
      throw new LowerError(
        diagnosticMessages.expectedParameterType("boundary shape", name),
        node.location,
      );
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("boundary shape", name),
        node.location,
      );
  }
};

const collectBoundaryKeywordVariables = (
  parameters: ASTParameterNode[],
  startIndex: number,
  paramCtx: ReturnType<typeof asParameterLoweringContext>,
  location: SourceCodeLocation,
): Map<string, CustomVariableReference> => {
  const values = new Map<string, CustomVariableReference>();
  for (let i = startIndex; i < parameters.length; i++) {
    const parameter = parameters[i]!;
    if (parameter.kind !== SyntaxKind.KEYWORD) {
      continue;
    }
    const valueNode = parameters[i + 1];
    if (valueNode === undefined) {
      throw new LowerError(
        diagnosticMessages.invalidParameterCount(i + 2, parameters.length),
        location,
      );
    }
    values.set(
      parameter.value,
      resolveCustomVariableReference(valueNode, paramCtx),
    );
    i++;
  }
  return values;
};

export const lowerSetBoundary = (
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
  const object = resolveObjectReference(parameters[0]!, paramCtx);
  const shape = parseBoundaryShape(parameters[1]!, location);
  const vars = collectBoundaryKeywordVariables(
    parameters,
    2,
    paramCtx,
    location,
  );

  switch (shape) {
    case BoundaryShape.Sphere: {
      const radius = vars.get("radius");
      if (radius === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("radius", ""),
          location,
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: { object, shape, radius },
      };
    }
    case BoundaryShape.Box: {
      const width = vars.get("width");
      const depth = vars.get("length") ?? vars.get("depth");
      const height = vars.get("pos_height") ?? vars.get("height");
      if (width === undefined || depth === undefined || height === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "box boundary dimensions",
            "",
          ),
          location,
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: { object, shape, width, depth, height },
      };
    }
    case BoundaryShape.Cylinder: {
      const radius = vars.get("radius");
      const height = vars.get("pos_height") ?? vars.get("height");
      if (radius === undefined || height === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "cylinder boundary dimensions",
            "",
          ),
          location,
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: { object, shape, radius, height },
      };
    }
  }
};
