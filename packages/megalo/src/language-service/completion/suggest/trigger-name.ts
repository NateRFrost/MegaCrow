import { TRIGGER_EXECUTION_KINDS } from "src/frontend/language-configuration/omni/triggers";
import { SymbolKind } from "src/frontend/symbol-table";
import {
  filterByPrefix,
  suggestKeywords,
  suggestSymbolKind,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TriggerNameCompletionContext,
} from "src/language-service/completion/types";

/**
 * Trigger / for_each header: execution kinds + declared map_object filters.
 */
export const suggestTriggerName = (
  ctx: TriggerNameCompletionContext
): CompletionItem[] => {
  const kinds = suggestKeywords(ctx, TRIGGER_EXECUTION_KINDS, "enumMember");
  const filters = suggestSymbolKind(ctx, SymbolKind.ObjectFilter);
  const seen = new Set(kinds.map((item) => item.label));
  const merged = [...kinds];
  for (const item of filters) {
    if (seen.has(item.label)) {
      continue;
    }
    seen.add(item.label);
    merged.push(item);
  }
  return filterByPrefix(merged, ctx.prefix.text);
};
