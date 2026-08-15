import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `object_set_orientation <object> <facing> [absolute_orientation]` */
export const completeObjectSetOrientation = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
      return suggestKeywords(ctx, ["absolute_orientation"]);
    default:
      return [];
  }
};
