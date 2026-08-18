import { SymbolKind } from "src/frontend/symbol-table";
import {
  filterByPrefix,
  suggestKeywords,
  suggestSymbolKind,
  withBlockEndSnippet,
} from "src/language-service/completion/helpers";
import { suggestableTriggerExecutionKinds } from "src/language-service/completion/suggest/trigger-kinds";
import type {
  CompletionItem,
  TriggerNameCompletionContext,
} from "src/language-service/completion/types";

/**
 * Trigger / for_each header: execution kinds + declared map_object filters.
 * Accepting a name opens the block body and inserts a matching `end`.
 */
export const suggestTriggerName = (
  ctx: TriggerNameCompletionContext
): CompletionItem[] => {
  const kinds = suggestKeywords(
    ctx,
    suggestableTriggerExecutionKinds(ctx.snapshot.version),
    "enumMember"
  ).map((entry) => withBlockEndSnippet(entry));
  const filters = suggestSymbolKind(ctx, SymbolKind.ObjectFilter).map((entry) =>
    withBlockEndSnippet(entry)
  );
  const seen = new Set(kinds.map((entry) => entry.label));
  const merged = [...kinds];
  for (const entry of filters) {
    if (seen.has(entry.label)) {
      continue;
    }
    seen.add(entry.label);
    merged.push(entry);
  }
  return filterByPrefix(merged, ctx.prefix.text);
};
