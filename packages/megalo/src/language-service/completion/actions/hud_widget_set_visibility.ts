import {
  ParameterType,
  suggestBoolean,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeHudWidgetSetVisibility = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.HudWidget);
    case 1:
      return suggestTyped(ctx, ParameterType.Player);
    case 2:
      return suggestBoolean(ctx);
    default:
      return [];
  }
};
