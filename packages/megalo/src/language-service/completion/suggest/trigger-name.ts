import { SymbolKind } from "src/frontend/symbol-table";
import {
  filterByPrefix,
  followingLineClosesBlock,
  suggestKeywords,
  suggestSymbolKind,
  withBlockEndSnippet,
  withEnterBlockBody,
} from "src/language-service/completion/helpers";
import { suggestableTriggerExecutionKinds } from "src/language-service/completion/suggest/trigger-kinds";
import type {
  CompletionItem,
  TriggerNameCompletionContext,
} from "src/language-service/completion/types";

/**
 * Trigger / for_each header: execution kinds + declared map_object filters.
 * Accepting a name opens the block body and inserts a matching `end`, unless
 * the opener already inserted one.
 */
export const suggestTriggerName = (
  ctx: TriggerNameCompletionContext
): CompletionItem[] => {
  const wrapEnd = !followingLineClosesBlock(ctx.snapshot.source, ctx.offset);
  const maybeWrap = (entry: CompletionItem): CompletionItem =>
    wrapEnd ? withBlockEndSnippet(entry) : withEnterBlockBody(entry);
  const kinds = suggestKeywords(
    ctx,
    suggestableTriggerExecutionKinds(ctx.snapshot.version),
    "enumMember"
  ).map(maybeWrap);
  const filters = suggestSymbolKind(ctx, SymbolKind.ObjectFilter).map(
    maybeWrap
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
