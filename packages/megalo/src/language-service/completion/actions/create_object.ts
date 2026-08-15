import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  ObjectListType,
  ParameterType,
  suggestKeywords,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

const FLAGS = ["never_garbage", "suppress_effect", "absolute_orientation"];

const OPTIONAL_KEYWORDS = [
  "at",
  "set",
  "offset",
  "label",
  "variant",
  ...FLAGS,
] as const;

/** Skip trailing INVALID placeholders (missing values after `at`/`set`/…). */
const previousSignificant = (
  parameters: readonly ASTParameterNode[],
  slotIndex: number
): ASTParameterNode | undefined => {
  for (let i = Math.min(slotIndex, parameters.length) - 1; i >= 0; i--) {
    const node = parameters[i];
    if (node !== undefined && node.kind !== SyntaxKind.INVALID) {
      return node;
    }
  }
};

/** `create_object <type> [at …] [set …] [offset …] [label …] [variant …] [flags…]` */
export const completeCreateObject = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const p = ctx.statement.parameters;
  if (ctx.slotIndex === 0) {
    return suggestObjectList(ctx, ObjectListType.Objects, { quoted: true });
  }

  const prev = previousSignificant(p, ctx.slotIndex);
  if (prev?.kind === SyntaxKind.KEYWORD) {
    if (prev.value === "at" || prev.value === "set") {
      return suggestTyped(ctx, ParameterType.Object);
    }
    if (prev.value === "label") {
      return suggestTyped(ctx, ParameterType.ObjectFilter);
    }
    if (prev.value === "variant") {
      return suggestObjectList(ctx, ObjectListType.Strings, { quoted: true });
    }
    if (prev.value === "offset") {
      return suggestTyped(ctx, ParameterType.Integer);
    }
  }
  // offset takes 3 ints
  if (ctx.slotIndex >= 2) {
    const maybeOffset = p[ctx.slotIndex - 2];
    const maybeOffset3 = p[ctx.slotIndex - 3];
    if (
      maybeOffset?.kind === SyntaxKind.KEYWORD &&
      maybeOffset.value === "offset"
    ) {
      return suggestTyped(ctx, ParameterType.Integer);
    }
    if (
      maybeOffset3?.kind === SyntaxKind.KEYWORD &&
      maybeOffset3.value === "offset"
    ) {
      return suggestTyped(ctx, ParameterType.Integer);
    }
  }

  return [...suggestKeywords(ctx, OPTIONAL_KEYWORDS)];
};
