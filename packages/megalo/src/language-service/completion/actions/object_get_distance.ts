import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeObjectGetDistance = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
      return suggestTyped(ctx, ParameterType.Integer, { writable: true });
    default:
      return [];
  }
};
