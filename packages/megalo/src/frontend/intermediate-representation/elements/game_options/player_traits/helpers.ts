import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  type Located,
  located,
} from "src/frontend/intermediate-representation";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters";
import { resolveObjectTypeReference } from "src/frontend/intermediate-representation/parameters/references";
import type { ObjectListType } from "src/frontend/object-lists";

export const parameterLocation = (
  parameters: ASTParameterNode[],
  fallback: SourceCodeLocation
): SourceCodeLocation => parameters[0]?.location ?? fallback;

export const resolveKeyword = (
  node: ASTParameterNode | undefined
): string | undefined => {
  if (node === undefined) {
    return;
  }
  if (node.kind === SyntaxKind.KEYWORD) {
    return node.value;
  }
  if (node.kind === SyntaxKind.REFERENCE) {
    return node.identifier;
  }
  return;
};

export const resolveEnumKeyword = <T extends string>(
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

export interface TraitOptionArgs {
  ctx: ParameterLoweringContext;
  first: ASTParameterNode | undefined;
  location: SourceCodeLocation;
  parameters: ASTParameterNode[];
}
