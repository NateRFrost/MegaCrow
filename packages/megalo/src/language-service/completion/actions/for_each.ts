import { SymbolKind } from "src/frontend/symbol-table";
import {
  suggestKeywords,
  suggestSymbolKind,
  withBlockEndSnippet,
} from "src/language-service/completion/helpers";
import { suggestableTriggerExecutionKinds } from "src/language-service/completion/suggest/trigger-kinds";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `for_each` as an action name fallback — prefer statement-node trigger-name path. */
export const completeForEach = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  if (ctx.slotIndex !== 0) {
    return [];
  }
  return [
    ...suggestKeywords(
      ctx,
      suggestableTriggerExecutionKinds(ctx.snapshot.version),
      "enumMember"
    ),
    ...suggestSymbolKind(ctx, SymbolKind.ObjectFilter),
  ].map((entry) => withBlockEndSnippet(entry));
};
