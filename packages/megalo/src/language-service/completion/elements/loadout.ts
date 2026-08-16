import type { LoadoutElementNode } from "src/frontend/abstract-syntax-tree/elements/loadout";
import {
  focusNamedPropertyAllowingEmptyValue,
  isPastCompletedPropertyValue,
  isSameLineAs,
  type NamedPropertyLike,
} from "src/language-service/completion/elements/property";
import {
  ObjectListType,
  suggestKeywords,
  suggestObjectList,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const LOADOUT_KEYS = [
  "name",
  "primary_weapon",
  "backpack_weapon",
  "equipment",
  "grenades",
  "end",
] as const;

const OBJECT_LIST_SENTINELS = ["none", "default", "random"] as const;
const GRENADE_KEYWORDS = ["none", "default"] as const;

const sameLineAfter = (
  ctx: ElementCompletionContext,
  property: NamedPropertyLike
): boolean => isSameLineAs(ctx.snapshot, ctx.offset, property.location);

const completeValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "name":
      return suggestObjectList(ctx, ObjectListType.Loadouts);
    case "primary_weapon":
    case "backpack_weapon":
      return [
        ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
        ...suggestObjectList(ctx, ObjectListType.Weapons),
      ];
    case "equipment":
      return [
        ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
        ...suggestObjectList(ctx, ObjectListType.Equipment),
      ];
    case "grenades":
      return suggestKeywords(ctx, GRENADE_KEYWORDS, "enumMember");
    default:
      return [];
  }
};

export const completeLoadout = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as LoadoutElementNode;

  const focus = focusNamedPropertyAllowingEmptyValue(
    element.items,
    ctx.offset,
    (property) => sameLineAfter(ctx, property)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  if (
    isPastCompletedPropertyValue(element.items, ctx.offset, (property) =>
      sameLineAfter(ctx, property)
    )
  ) {
    return [];
  }
  return suggestKeywords(ctx, LOADOUT_KEYS, "property");
};
