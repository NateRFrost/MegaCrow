import type { PlayerRatingElementNode } from "src/frontend/abstract-syntax-tree/elements/player_rating";
import {
  focusKeyValueProperty,
  isSameLineAs,
} from "src/language-service/completion/elements/property";
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

export const completePlayerRating = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as PlayerRatingElementNode;

  const focus = focusKeyValueProperty(element.fields, ctx.offset, (field) =>
    isSameLineAs(ctx.snapshot, ctx.offset, field.location)
  );
  if (focus?.kind === "value") {
    return suggestTyped(ctx, ParameterType.Integer);
  }
  return suggestKeywords(ctx, PLAYER_RATING_KEYS, "property");
};
