import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeGetRandomObject = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.ObjectFilter);
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
      return suggestTyped(ctx, ParameterType.Object, { writable: true });
    default:
      return [];
  }
};
