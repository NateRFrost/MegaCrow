import type { SourceCodeLocation } from "src/diagnostics";
import type { PlayerRatingElementNode } from "src/frontend/abstract-syntax-tree/elements/player_rating";
import { isSameLineAs } from "src/language-service/completion/elements/property";
import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const PLAYER_RATING_KEYS = [
  "rating_scale",
  "kill_weight",
  "assist_weight",
  "betrayal_weight",
  "death_weight",
  "normalize_by_max_kills",
  "base_value",
  "range",
  "loss_scalar",
  "custom_stat_0",
  "custom_stat_1",
  "custom_stat_2",
  "custom_stat_3",
  "expansion_0",
  "expansion_1",
  "show_in_scoreboard",
  "end",
] as const;

interface KeyValueLike {
  key: string;
  location: SourceCodeLocation;
  value: { location: SourceCodeLocation };
}

const focusKeyValue = (
  fields: readonly KeyValueLike[],
  offset: number,
  sameLineAfterKey: (field: KeyValueLike) => boolean
): { kind: "key" | "value"; key: string } | undefined => {
  for (const field of fields) {
    const valueStart = field.value.location.start.localOffset;
    const valueEnd = field.value.location.end.localOffset;
    if (offset > field.location.end.localOffset && offset < valueStart) {
      return { kind: "value", key: field.key };
    }
    if (offset >= valueStart && offset <= valueEnd) {
      return { kind: "value", key: field.key };
    }
    if (
      offset >= field.location.start.localOffset &&
      offset <= field.location.end.localOffset
    ) {
      return { kind: "key", key: field.key };
    }
  }
  for (const field of fields) {
    if (offset > field.location.end.localOffset && sameLineAfterKey(field)) {
      return { kind: "value", key: field.key };
    }
  }
  return;
};

export const completePlayerRating = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as PlayerRatingElementNode;

  const focus = focusKeyValue(element.fields, ctx.offset, (field) =>
    isSameLineAs(ctx.snapshot, ctx.offset, field.location)
  );
  if (focus?.kind === "value") {
    return suggestTyped(ctx, ParameterType.Integer);
  }
  return suggestKeywords(ctx, PLAYER_RATING_KEYS, "property");
};
