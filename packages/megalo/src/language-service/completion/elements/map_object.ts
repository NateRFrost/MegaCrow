import type { MapObjectElementNode } from "src/frontend/abstract-syntax-tree/elements/map_object";
import { objectTeamFilter } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import { MAP_OBJECT_PROPERTY_KEYS } from "src/frontend/language-configuration/omni/map_object";
import {
  focusKeyValueProperty,
  isSameLineAs,
} from "src/language-service/completion/elements/property";
import {
  ObjectListType,
  ParameterType,
  suggestEnum,
  suggestKeywords,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const completeValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "label":
      return suggestTyped(ctx, ParameterType.String);
    case "type":
      return suggestObjectList(ctx, ObjectListType.Objects, { quoted: true });
    case "team":
      return suggestEnum(ctx, objectTeamFilter);
    case "user_data":
    case "min":
      return suggestTyped(ctx, ParameterType.Integer);
    default:
      return [];
  }
};

export const completeMapObject = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as MapObjectElementNode;

  const focus = focusKeyValueProperty(
    element.properties,
    ctx.offset,
    (property) => isSameLineAs(ctx.snapshot, ctx.offset, property.location)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  return [
    ...suggestKeywords(ctx, ["end"], "keyword"),
    ...suggestKeywords(ctx, MAP_OBJECT_PROPERTY_KEYS, "property"),
  ];
};
