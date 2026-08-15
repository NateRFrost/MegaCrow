import type { SourceCodeLocation } from "src/diagnostics";
import type { MapPermissionsElementNode } from "src/frontend/abstract-syntax-tree/elements/map_permissions";
import { isSameLineAs } from "src/language-service/completion/elements/property";
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

const KEYS = ["default", "exception"] as const;

interface KeyValueLike {
  key: string;
  location: SourceCodeLocation;
  value: { location: SourceCodeLocation };
}

const focusKeyValue = (
  entries: readonly KeyValueLike[],
  offset: number,
  sameLineAfterKey: (entry: KeyValueLike) => boolean
): { kind: "key" | "value"; key: string } | undefined => {
  for (const entry of entries) {
    const valueStart = entry.value.location.start.localOffset;
    const valueEnd = entry.value.location.end.localOffset;
    if (offset > entry.location.end.localOffset && offset < valueStart) {
      return { kind: "value", key: entry.key };
    }
    if (offset >= valueStart && offset <= valueEnd) {
      return { kind: "value", key: entry.key };
    }
    if (
      offset >= entry.location.start.localOffset &&
      offset <= entry.location.end.localOffset
    ) {
      return { kind: "key", key: entry.key };
    }
  }
  for (const entry of entries) {
    if (offset > entry.location.end.localOffset && sameLineAfterKey(entry)) {
      return { kind: "value", key: entry.key };
    }
  }
  return;
};

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

  const focus = focusKeyValue(element.entries, ctx.offset, (entry) =>
    isSameLineAs(ctx.snapshot, ctx.offset, entry.location)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, KEYS, "property");
};
