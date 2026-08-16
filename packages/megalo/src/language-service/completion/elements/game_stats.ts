import type { SourceCodeLocation } from "src/diagnostics";
import type { GameStatsElementNode } from "src/frontend/abstract-syntax-tree/elements/game_stats";
import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const FORMAT_KINDS = ["number", "timer", "delta", "percentage"] as const;
const GROUPING_KINDS = ["none", "team"] as const;

const containsInclusive = (
  location: SourceCodeLocation,
  offset: number
): boolean =>
  offset >= location.start.localOffset && offset <= location.end.localOffset;

export const completeGameStats = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as GameStatsElementNode;

  for (const entry of element.entries) {
    if (
      ctx.offset < entry.location.start.localOffset ||
      ctx.offset > entry.location.end.localOffset
    ) {
      continue;
    }

    if (containsInclusive(entry.name.location, ctx.offset)) {
      return [];
    }
    if (containsInclusive(entry.type.location, ctx.offset)) {
      return suggestKeywords(ctx, FORMAT_KINDS, "keyword");
    }
    if (containsInclusive(entry.labelString.location, ctx.offset)) {
      return suggestTyped(ctx, ParameterType.String);
    }
    if (containsInclusive(entry.grouping.location, ctx.offset)) {
      return suggestKeywords(ctx, GROUPING_KINDS, "enumMember");
    }
    if (containsInclusive(entry.sort.location, ctx.offset)) {
      return suggestTyped(ctx, ParameterType.Integer);
    }
  }

  return suggestKeywords(ctx, ["end"], "keyword");
};
