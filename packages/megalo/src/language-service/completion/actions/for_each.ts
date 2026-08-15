import { TRIGGER_EXECUTION_KINDS } from "src/frontend/language-configuration/omni/triggers";
import { SymbolKind } from "src/frontend/symbol-table";
import {
  suggestKeywords,
  suggestSymbolKind,
} from "src/language-service/completion/helpers";
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
    ...suggestKeywords(ctx, TRIGGER_EXECUTION_KINDS, "enumMember"),
    ...suggestSymbolKind(ctx, SymbolKind.ObjectFilter),
  ];
};
