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

const OPTIONAL_KEYWORDS_FROM_73 = [
  "offset",
  "variant",
  "suppress_effect",
  "absolute_orientation",
] as const;

const OPTIONAL_KEYWORDS = [
  "at",
  "set",
  "label",
  "never_garbage",
  ...OPTIONAL_KEYWORDS_FROM_73,
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

/** `create_object <type> [at …] [set …] …` or Alpha `<type> <out> <place_at>`. */
export const completeCreateObject = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const p = ctx.statement.parameters;
  if (ctx.slotIndex === 0) {
    return suggestObjectList(ctx, ObjectListType.Objects, { quoted: true });
  }

  const prev = previousSignificant(p, ctx.slotIndex);
  if (prev?.kind === SyntaxKind.KEYWORD) {
    if (prev.value === "at") {
      return suggestTyped(ctx, ParameterType.Object);
    }
    if (prev.value === "set") {
      return suggestTyped(ctx, ParameterType.Object, { writable: true });
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

  // Alpha positional operands after the type: <out> then <place_at>.
  if (
    ctx.snapshot.version.version < 73 &&
    prev !== undefined &&
    prev.kind !== SyntaxKind.KEYWORD
  ) {
    if (ctx.slotIndex === 1) {
      return [
        ...suggestTyped(ctx, ParameterType.Object, { writable: true }),
        ...suggestKeywords(
          ctx,
          OPTIONAL_KEYWORDS.filter(
            (keyword) =>
              !(OPTIONAL_KEYWORDS_FROM_73 as readonly string[]).includes(
                keyword
              )
          )
        ),
      ];
    }
    if (ctx.slotIndex === 2) {
      return suggestTyped(ctx, ParameterType.Object);
    }
  }

  const keywords =
    ctx.snapshot.version.version < 73
      ? OPTIONAL_KEYWORDS.filter(
          (keyword) =>
            !(OPTIONAL_KEYWORDS_FROM_73 as readonly string[]).includes(keyword)
        )
      : OPTIONAL_KEYWORDS;
  return [...suggestKeywords(ctx, keywords)];
};
