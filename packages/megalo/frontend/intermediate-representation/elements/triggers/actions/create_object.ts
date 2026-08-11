import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../../object-lists";
import { SymbolKind } from "../../../../symbol-table";
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
import {
  resolveObjectReference,
  resolveObjectTypeReference,
  resolveScriptStringTableReference,
} from "../../../parameters";
import { requireKeyword } from "../helpers";

const resolveObjectListKeywordIndex = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? ctx.symbolTable.getSymbol(node.symbolId)?.name
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, ""),
      node.location ?? location,
    );
  }

  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === name,
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, name),
      node.location ?? location,
    );
  }
  return symbol.index;
};

const resolveObjectTypeParameter = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    return resolveObjectTypeReference(node, asParameterLoweringContext(ctx));
  }
  return resolveObjectListKeywordIndex(
    node,
    ObjectListType.Objects,
    ctx,
    location,
  );
};

const resolveObjectFilterIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location ?? location,
    );
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol?.kind !== SymbolKind.ObjectFilter) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("object filter", ""),
      node.location,
    );
  }
  return symbol.index;
};

const parseOffset = (
  parameters: ASTParameterNode[],
  startIndex: number,
  location: SourceCodeLocation,
): ObjectOffset => {
  const xNode = parameters[startIndex];
  const yNode = parameters[startIndex + 1];
  const zNode = parameters[startIndex + 2];
  if (xNode === undefined || yNode === undefined || zNode === undefined) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        3,
        parameters.length - startIndex,
      ),
      location,
    );
  }

  const parseComponent = (node: ASTParameterNode, axis: string): number => {
    if (
      node.kind === SyntaxKind.INTEGER ||
      node.kind === SyntaxKind.FLOATING_POINT
    ) {
      return node.value;
    }
    throw new LowerError(
      diagnosticMessages.expectedParameterType(`${axis} offset`, ""),
      node.location,
    );
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
  location: SourceCodeLocation,
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.String) {
      return resolveScriptStringTableReference(node, ctx.ir, ctx.symbolTable);
    }
  }

  const name = requireKeyword(node, location);
  const stringSymbol = ctx.symbolTable
    .toArray()
    .find((entry) => entry.kind === SymbolKind.String && entry.name === name);
  if (stringSymbol?.kind === SymbolKind.String) {
    return ctx.ir.gameVariant.scriptStrings.addEntry(
      stringSymbol.languageContents,
      stringSymbol.id,
    );
  }

  if (/^\d+$/.test(name)) {
    return Number(name);
  }

  return ctx.ir.gameVariant.scriptStrings.addEntry({ english: name });
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
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location,
    );
  }

  const paramCtx = asParameterLoweringContext(ctx);
  const result: Action & { type: ActionType.CreateObject } = {
    type: ActionType.CreateObject,
    parameters: {
      objectType: resolveObjectTypeParameter(parameters[0]!, ctx, location),
      place_at_object: resolveObjectReference(parameters[2]!, paramCtx),
    },
  };

  for (let i = 1; i < parameters.length; i++) {
    const node = parameters[i]!;
    if (node.kind !== SyntaxKind.KEYWORD) {
      continue;
    }

    switch (node.value) {
      case "at":
        result.parameters.place_at_object = resolveObjectReference(
          parameters[++i]!,
          paramCtx,
        );
        break;
      case "set":
        result.parameters.object_reference_out = resolveObjectReference(
          parameters[++i]!,
          paramCtx,
        );
        break;
      case "label":
        result.parameters.labelIndex = resolveObjectFilterIndex(
          parameters[++i]!,
          ctx,
          location,
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
        result.parameters.offset = parseOffset(parameters, i + 1, location);
        i += 3;
        break;
      case "variant":
        result.parameters.variantNameIndex = resolveVariantNameIndex(
          parameters[++i]!,
          ctx,
          location,
        );
        break;
      default:
        if (!CREATE_OBJECT_KEYWORDS.has(node.value)) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "create_object keyword",
              node.value,
            ),
            node.location,
          );
        }
        break;
    }
  }

  return result;
};
