import {
  ParameterType,
  suggestPlayerFilter,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeNavpointSetVisible = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  if (ctx.slotIndex === 0) {
    return suggestTyped(ctx, ParameterType.Object);
  }
  return suggestPlayerFilter(ctx, 1);
};
