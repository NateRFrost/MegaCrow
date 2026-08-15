import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `object_attach <child> <parent> <x> <y> <z> [absolute_orientation]` */
export const completeObjectAttach = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
    case 3:
    case 4:
      return suggestTyped(ctx, ParameterType.Integer);
    case 5:
      return suggestKeywords(ctx, ["absolute_orientation"]);
    default:
      return [];
  }
};
