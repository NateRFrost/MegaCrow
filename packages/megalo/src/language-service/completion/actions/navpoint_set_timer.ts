import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `navpoint_set_timer <object> none|timer` */
export const completeNavpointSetTimer = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return [
        ...suggestKeywords(ctx, ["none"], "enumMember"),
        ...suggestTyped(ctx, ParameterType.Timer),
      ];
    default:
      return [];
  }
};
