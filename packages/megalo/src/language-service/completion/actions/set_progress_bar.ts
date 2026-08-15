import {
  ParameterType,
  suggestPlayerFilter,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `set_progress_bar <object> <player_filter> [timer]` */
export const completeSetProgressBar = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  if (ctx.slotIndex === 0) {
    return suggestTyped(ctx, ParameterType.Object);
  }
  const filter = suggestPlayerFilter(ctx, 1);
  if (filter.length > 0) {
    return filter;
  }
  // After filter: optional timer (or nothing when filter is no_one)
  return suggestTyped(ctx, ParameterType.Timer);
};
