import type { LoadoutPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout_palette";
import {
  focusNamedPropertyAllowingEmptyValue,
  isSameLineAs,
  type NamedPropertyLike,
} from "src/language-service/completion/elements/property";
import {
  SymbolKind,
  suggestKeywords,
  suggestSymbolKind,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const KEYS = ["item", "end"] as const;

const sameLineAfter = (
  ctx: ElementCompletionContext,
  property: NamedPropertyLike
): boolean => isSameLineAs(ctx.snapshot, ctx.offset, property.location);

export const completeLoadoutPalette = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as LoadoutPaletteElementNode;

  const focus = focusNamedPropertyAllowingEmptyValue(
    element.items,
    ctx.offset,
    (property) => sameLineAfter(ctx, property)
  );
  if (focus?.kind === "value") {
    return suggestSymbolKind(ctx, SymbolKind.Loadout);
  }
  return suggestKeywords(ctx, KEYS, "property");
};
