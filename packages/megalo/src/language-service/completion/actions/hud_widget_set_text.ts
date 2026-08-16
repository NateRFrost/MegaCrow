import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeHudWidgetSetText = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.HudWidget, {
        continueCompletion: true,
      });
    case 1:
      return suggestTyped(ctx, ParameterType.DynamicString);
    default:
      return [];
  }
};
