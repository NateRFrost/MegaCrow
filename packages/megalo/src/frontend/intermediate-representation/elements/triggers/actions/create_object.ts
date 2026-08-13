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
  resolveObjectReference,
  resolveObjectTypeReference,
} from "src/frontend/intermediate-representation/parameters";
import { lowerConstantInteger } from "src/frontend/intermediate-representation/parameters/common";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

const resolveObjectFilterIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location ?? location
    );
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== SymbolKind.ObjectFilter) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location
    );
  }
  return symbol.index;
};

const parseOffset = (
  parameters: ASTParameterNode[],
  startIndex: number,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): ObjectOffset => {
  const xNode = parameters[startIndex];
  const yNode = parameters[startIndex + 1];
  const zNode = parameters[startIndex + 2];
  if (xNode === undefined || yNode === undefined || zNode === undefined) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        3,
        parameters.length - startIndex
      ),
      location
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  const parseComponent = (node: ASTParameterNode, axis: string): number => {
    try {
      return lowerConstantInteger(node, paramCtx, `${axis} offset`, location)
        .value;
    } catch {
      throw new LowerError(
        diagnosticMessages.expectedParameterType(`${axis} offset`, ""),
        node.location
      );
    }
  };

  return {
    x: parseComponent(xNode, "x"),
    y: parseComponent(yNode, "y"),
    z: parseComponent(zNode, "z"),
  };
};

const resolveVariantNameIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  // MegaloEdit ReadStringIdName: identifier or quoted string from
  // object_lists/strings.txt (1-based line index).
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.QUOTED_STRING
        ? node.value
        : node.kind === SyntaxKind.REFERENCE
          ? (ctx.symbolTable.getSymbol(node.symbolId)?.name ?? node.identifier)
          : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object variant name", ""),
      node.location ?? location
    );
  }

  const listItem = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === ObjectListType.Strings &&
        entry.name === name
    );
  if (listItem?.kind === SymbolKind.ObjectListItem) {
    return listItem.index + 1;
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType("object variant name", name),
    node.location ?? location
  );
};

const CREATE_OBJECT_KEYWORDS = new Set([
  "at",
  "set",
  "label",
  "never_garbage",
  "suppress_effect",
  "absolute_orientation",
  "offset",
  "variant",
]);

export const lowerCreateObject = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 1) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(1, parameters.length),
      location
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  let placeAtObject: ReturnType<typeof resolveObjectReference> | undefined;
  const result: Action & { type: ActionType.CreateObject } = {
    type: ActionType.CreateObject,
    parameters: {
      objectType: resolveObjectTypeReference(parameters[0]!, paramCtx),
      // Filled below once `at` is seen; required before return.
      place_at_object: undefined!,
    },
  };

  for (let i = 1; i < parameters.length; i++) {
    const node = parameters[i]!;
    if (node.kind !== SyntaxKind.KEYWORD) {
      continue;
    }

    switch (node.value) {
      case "at":
        placeAtObject = resolveObjectReference(parameters[++i]!, paramCtx);
        result.parameters.place_at_object = placeAtObject;
        break;
      case "set":
        result.parameters.object_reference_out = resolveObjectReference(
          parameters[++i]!,
          paramCtx
        );
        break;
      case "label":
        result.parameters.labelIndex = resolveObjectFilterIndex(
          parameters[++i]!,
          ctx,
          location
        );
        break;
      case "never_garbage":
        result.parameters.neverGarbageCollect = true;
        break;
      case "suppress_effect":
        result.parameters.suppressEffect = true;
        break;
      case "absolute_orientation":
        result.parameters.absoluteOrientation = true;
        break;
      case "offset":
        result.parameters.offset = parseOffset(
          parameters,
          i + 1,
          ctx,
          location
        );
        i += 3;
        break;
      case "variant":
        result.parameters.variantNameIndex = resolveVariantNameIndex(
          parameters[++i]!,
          ctx,
          location
        );
        break;
      default:
        if (!CREATE_OBJECT_KEYWORDS.has(node.value)) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "create_object keyword",
              node.value
            ),
            node.location
          );
        }
        break;
    }
  }

  if (placeAtObject === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("at <object>", ""),
      location
    );
  }

  return result;
};
