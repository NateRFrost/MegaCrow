import { suggestBoolean } from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `debugging_enable_tracing <bool>` */
export const completeDebuggingEnableTracing = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestBoolean(ctx);
    default:
      return [];
  }
};
