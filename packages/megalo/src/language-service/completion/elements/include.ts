import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

/** Path completions are handled by the LSP via `megacrow/listDirectory`. */
export const completeInclude = (
  _ctx: ElementCompletionContext
): CompletionItem[] => [];
