import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `timer_set_rate <timer> <rate>` */
export const completeTimerSetRate = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Timer, { writable: true });
    case 1:
      return suggestTyped(ctx, ParameterType.Float);
    default:
      return [];
  }
};
