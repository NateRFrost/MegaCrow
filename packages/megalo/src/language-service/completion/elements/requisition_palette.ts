import type { RequisitionPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/requisition_palette";
import { isSameLineAs } from "src/language-service/completion/elements/property";
import {
  ObjectListType,
  suggestKeywords,
  suggestObjectList,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const BODY_KEYS = ["baseline", "item"] as const;
const BASELINE_STATES = ["enabled", "disabled"] as const;
const ITEM_STATES = ["available", "unavailable", "disabled"] as const;

export const completeRequisitionPalette = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as RequisitionPaletteElementNode;

  if (
    element.baseline !== undefined &&
    ctx.offset >= element.baseline.location.start.localOffset &&
    ctx.offset <= element.baseline.location.end.localOffset
  ) {
    return suggestKeywords(ctx, BASELINE_STATES, "enumMember");
  }

  for (const item of element.items) {
    if (
      ctx.offset < item.location.start.localOffset ||
      ctx.offset > item.location.end.localOffset
    ) {
      continue;
    }

    if (
      ctx.offset >= item.name.location.start.localOffset &&
      ctx.offset <= item.name.location.end.localOffset
    ) {
      return suggestObjectList(ctx, ObjectListType.Objects);
    }

    if (
      ctx.offset >= item.state.location.start.localOffset &&
      ctx.offset <= item.state.location.end.localOffset
    ) {
      return suggestKeywords(ctx, ITEM_STATES, "enumMember");
    }

    if (
      ctx.offset > item.name.location.end.localOffset &&
      isSameLineAs(ctx.snapshot, ctx.offset, item.name.location)
    ) {
      return suggestKeywords(ctx, ITEM_STATES, "enumMember");
    }

    return suggestObjectList(ctx, ObjectListType.Objects);
  }

  return suggestKeywords(ctx, BODY_KEYS, "property");
};
