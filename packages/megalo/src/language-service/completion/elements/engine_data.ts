import type { EngineDataElementNode } from "src/frontend/abstract-syntax-tree/elements/engine_data";
import { ENGINE_CATEGORY_STRING_PREFIX } from "src/frontend/language-configuration/omni/engine_data";
import {
  focusNamedPropertyAllowingEmptyValue,
  isSameLineAs,
  type NamedPropertyLike,
} from "src/language-service/completion/elements/property";
import {
  forReplacingToken,
  ParameterType,
  SymbolKind,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const KEYS = ["name", "description", "icon", "category"] as const;

const sameLineAfter = (
  ctx: ElementCompletionContext,
  property: NamedPropertyLike
): boolean => isSameLineAs(ctx.snapshot, ctx.offset, property.location);

const suggestEngineCategories = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const items: CompletionItem[] = [];
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== SymbolKind.String) {
      continue;
    }
    if (!entry.name.startsWith(ENGINE_CATEGORY_STRING_PREFIX)) {
      continue;
    }
    const label = entry.name.slice(ENGINE_CATEGORY_STRING_PREFIX.length);
    items.push({
      label,
      kind: "enumMember",
      sortText: label,
      detail: entry.name,
    });
  }
  // Categories are small enums — keep all options while replacing a value.
  return forReplacingToken(ctx, items);
};

const completeValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "name":
    case "description":
      return suggestTyped(ctx, ParameterType.String, { replacingToken: true });
    case "icon":
      return suggestTyped(ctx, ParameterType.Integer, { replacingToken: true });
    case "category":
      return suggestEngineCategories(ctx);
    default:
      return [];
  }
};

export const completeEngineData = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as EngineDataElementNode;

  const focus = focusNamedPropertyAllowingEmptyValue(
    element.properties,
    ctx.offset,
    (property) => sameLineAfter(ctx, property)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, KEYS, "property");
};
