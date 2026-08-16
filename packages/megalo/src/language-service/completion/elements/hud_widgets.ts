import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type { HudWidgetsElementNode } from "src/frontend/abstract-syntax-tree/elements/hud_widgets";
import { hudWidgetPosition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import { isSameLineAs } from "src/language-service/completion/elements/property";
import {
  suggestEnum,
  suggestKeywords,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

export const completeHudWidgets = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as HudWidgetsElementNode;

  for (const entry of element.entries) {
    if (
      ctx.offset < entry.location.start.localOffset ||
      ctx.offset > entry.location.end.localOffset
    ) {
      continue;
    }

    if (
      !isAstErrorNode(entry.position) &&
      ctx.offset >= entry.position.location.start.localOffset &&
      ctx.offset <= entry.position.location.end.localOffset
    ) {
      return suggestEnum(ctx, hudWidgetPosition);
    }

    if (
      !isAstErrorNode(entry.name) &&
      ctx.offset > entry.name.location.end.localOffset &&
      isSameLineAs(ctx.snapshot, ctx.offset, entry.name.location)
    ) {
      return suggestEnum(ctx, hudWidgetPosition);
    }
  }

  return suggestKeywords(ctx, ["end"], "keyword");
};
