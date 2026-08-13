import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  BoundaryShape,
  type Action,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { type CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import {
  resolveCustomVariableReference,
  resolveObjectReference,
} from "src/frontend/intermediate-representation/parameters";
import { requireKeyword } from "src/frontend/intermediate-representation/elements/triggers/helpers";

const parseBoundaryShape = (
  node: ASTParameterNode,
  location: SourceCodeLocation
): BoundaryShape | "none" => {
  const name = requireKeyword(node, location).toLowerCase();
  switch (name) {
    case "sphere":
      return BoundaryShape.Sphere;
    case "box":
      return BoundaryShape.Box;
    case "cylinder":
      return BoundaryShape.Cylinder;
    case "none":
      return "none";
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType("boundary shape", name),
        node.location
      );
  }
};

const isDimensionKeyword = (value: string): boolean =>
  value === "width" ||
  value === "radius" ||
  value === "length" ||
  value === "depth" ||
  value === "neg_height" ||
  value === "pos_height" ||
  value === "height";

/**
 * MegaloEdit uses positional custom vars after the shape. Docs-style keyword
 * forms (`width N`, `radius N`, …) are also accepted.
 */
const collectBoundaryDimensions = (
  parameters: ASTParameterNode[],
  startIndex: number,
  paramCtx: ReturnType<typeof asParameterLoweringContext>,
  location: SourceCodeLocation
): {
  positional: CustomVariableReference[];
  byKeyword: Map<string, CustomVariableReference>;
} => {
  const byKeyword = new Map<string, CustomVariableReference>();
  const positional: CustomVariableReference[] = [];

  for (let i = startIndex; i < parameters.length; i++) {
    const parameter = parameters[i]!;
    if (
      parameter.kind === SyntaxKind.KEYWORD &&
      isDimensionKeyword(parameter.value)
    ) {
      const valueNode = parameters[i + 1];
      if (valueNode === undefined) {
        throw new LowerError(
          diagnosticMessages.invalidParameterCount(i + 2, parameters.length),
          location
        );
      }
      byKeyword.set(
        parameter.value,
        resolveCustomVariableReference(valueNode, paramCtx)
      );
      i++;
      continue;
    }
    positional.push(resolveCustomVariableReference(parameter, paramCtx));
  }

  return { positional, byKeyword };
};

export const lowerSetBoundary = (
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
  const object = resolveObjectReference(parameters[0]!, paramCtx);
  const shape = parseBoundaryShape(parameters[1]!, location);

  if (shape === "none") {
    return {
      type: ActionType.SetBoundary,
      parameters: {
        object,
        shape: BoundaryShape.None,
      },
    };
  }

  const { positional, byKeyword } = collectBoundaryDimensions(
    parameters,
    2,
    paramCtx,
    location
  );

  switch (shape) {
    case BoundaryShape.Sphere: {
      const radius =
        byKeyword.get("radius") ??
        positional[0];
      if (radius === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("radius", ""),
          location
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: { object, shape, radius },
      };
    }
    case BoundaryShape.Box: {
      const width = byKeyword.get("width") ?? positional[0];
      const depth =
        byKeyword.get("length") ??
        byKeyword.get("depth") ??
        positional[1];
      const negHeight =
        byKeyword.get("neg_height") ?? positional[2];
      const posHeight =
        byKeyword.get("pos_height") ??
        byKeyword.get("height") ??
        positional[3] ??
        negHeight;
      if (
        width === undefined ||
        depth === undefined ||
        negHeight === undefined ||
        posHeight === undefined
      ) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "box boundary dimensions",
            ""
          ),
          location
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: {
          object,
          shape,
          width,
          depth,
          negHeight,
          posHeight,
        },
      };
    }
    case BoundaryShape.Cylinder: {
      const radius = byKeyword.get("radius") ?? positional[0];
      const negHeight =
        byKeyword.get("neg_height") ?? positional[1];
      const posHeight =
        byKeyword.get("pos_height") ??
        byKeyword.get("height") ??
        positional[2] ??
        negHeight;
      if (
        radius === undefined ||
        negHeight === undefined ||
        posHeight === undefined
      ) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "cylinder boundary dimensions",
            ""
          ),
          location
        );
      }
      return {
        type: ActionType.SetBoundary,
        parameters: {
          object,
          shape,
          radius,
          negHeight,
          posHeight,
        },
      };
    }
    case BoundaryShape.None:
      return {
        type: ActionType.SetBoundary,
        parameters: {
          object,
          shape: BoundaryShape.None,
        },
      };
  }
};
