import type { SourceCodeLocation } from "src/diagnostics";
import type { ConstantsElementNode } from "src/frontend/abstract-syntax-tree/elements/constants";
import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const containsInclusive = (
  location: SourceCodeLocation,
  offset: number
): boolean =>
  offset >= location.start.localOffset && offset <= location.end.localOffset;

export const completeConstants = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as ConstantsElementNode;

  for (const entry of element.entries) {
    if (
      ctx.offset < entry.location.start.localOffset ||
      ctx.offset > entry.location.end.localOffset
    ) {
      continue;
    }
    if (containsInclusive(entry.type.location, ctx.offset)) {
      return suggestKeywords(ctx, ["number"], "keyword").map(
        withContinueCompletion
      );
    }
    if (containsInclusive(entry.name.location, ctx.offset)) {
      return [];
    }
    if (containsInclusive(entry.value.location, ctx.offset)) {
      return suggestTyped(ctx, ParameterType.Integer);
    }
  }

  return suggestKeywords(ctx, ["number", "end"], "keyword").map((entry) =>
    entry.label === "end" ? entry : withContinueCompletion(entry)
  );
};
