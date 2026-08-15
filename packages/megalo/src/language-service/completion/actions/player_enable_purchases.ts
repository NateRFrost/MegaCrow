import {
  purchaseCategory,
  purchaseLifeState,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestBoolean,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completePlayerEnablePurchases = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Player);
    case 1:
      return suggestEnum(ctx, purchaseLifeState);
    case 2:
      return suggestEnum(ctx, purchaseCategory);
    case 3:
      return suggestBoolean(ctx);
    default:
      return [];
  }
};
