import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `hs_function_call <keyword>` */
export const completeHsFunctionCall = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return [];
    default:
      return [];
  }
};
