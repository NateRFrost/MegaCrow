import type { MapPermissionsElementNode } from "src/frontend/abstract-syntax-tree/elements/map_permissions";
import {
  focusKeyValueProperty,
  isSameLineAs,
} from "src/language-service/completion/elements/property";
import {
  ParameterType,
  suggestBoolean,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const KEYS = ["default", "exception", "end"] as const;

const completeValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  if (key === "default") {
    return [
      ...suggestBoolean(ctx),
      ...suggestTyped(ctx, ParameterType.Integer),
    ];
  }
  if (key === "exception") {
    return suggestTyped(ctx, ParameterType.Integer);
  }
  return [];
};

export const completeMapPermissions = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as MapPermissionsElementNode;

  const focus = focusKeyValueProperty(element.entries, ctx.offset, (entry) =>
    isSameLineAs(ctx.snapshot, ctx.offset, entry.location)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, KEYS, "property");
};
