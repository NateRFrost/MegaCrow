import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../../object-lists";
import { type Located, located } from "../../..";
import { LowerError } from "../../../error";
import type { ParameterLoweringContext } from "../../../parameters";
import { resolveObjectTypeReference } from "../../../parameters/references";

export const parameterLocation = (
  parameters: ASTParameterNode[],
  fallback: SourceCodeLocation
): SourceCodeLocation => parameters[0]?.location ?? fallback;

export const resolveKeyword = (
  node: ASTParameterNode | undefined
): string | undefined => {
  if (node === undefined) {
    return undefined;
  }
  if (node.kind === SyntaxKind.KEYWORD) {
    return node.value;
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    return node.identifier;
  }
  return undefined;
};

export const resolveEnumKeyword = <T extends number>(
  node: ASTParameterNode,
  mapping: Record<string, T>,
  expected: string
): Located<T> => {
  const name = resolveKeyword(node);
  if (name === undefined || mapping[name] === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, name ?? ""),
      node.location
    );
  }
  return located(mapping[name]!, node.location);
};

export const lowerObjectListIndex = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  objectType: ObjectListType,
  location: SourceCodeLocation
): Located<number> => {
  const first = parameters[0];
  if (first === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, ""),
      location
    );
  }
  return located(
    resolveObjectTypeReference(first, ctx, [objectType]),
    first.location
  );
};

export type TraitOptionArgs = {
  parameters: ASTParameterNode[];
  first: ASTParameterNode | undefined;
  ctx: ParameterLoweringContext;
  location: SourceCodeLocation;
};
