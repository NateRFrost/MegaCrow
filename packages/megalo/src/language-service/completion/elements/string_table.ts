import type { StringTableElementNode } from "src/frontend/abstract-syntax-tree/elements/string_table";
import { STRING_TABLE_LANGUAGES } from "src/frontend/language-configuration/omni/strings";
import { isSameLineAs } from "src/language-service/completion/elements/property";
import { suggestKeywords } from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

export const completeStringTable = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as StringTableElementNode;

  if (
    isSameLineAs(ctx.snapshot, ctx.offset, element.keywordLocation) &&
    ctx.offset >= element.keywordLocation.end.localOffset
  ) {
    return suggestKeywords(ctx, STRING_TABLE_LANGUAGES, "enumMember");
  }

  return [];
};
