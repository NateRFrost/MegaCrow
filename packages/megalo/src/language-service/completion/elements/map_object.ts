import type { SourceCodeLocation } from "src/diagnostics";
import type { MapObjectElementNode } from "src/frontend/abstract-syntax-tree/elements/map_object";
import { objectTeamFilter } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import { MAP_OBJECT_PROPERTY_KEYS } from "src/frontend/language-configuration/omni/map_object";
import { isSameLineAs } from "src/language-service/completion/elements/property";
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

interface KeyValueLike {
  key: string;
  location: SourceCodeLocation;
  value: { location: SourceCodeLocation };
}

const focusKeyValue = (
  properties: readonly KeyValueLike[],
  offset: number,
  sameLineAfterKey: (property: KeyValueLike) => boolean
): { kind: "key" | "value"; key: string } | undefined => {
  for (const property of properties) {
    const valueStart = property.value.location.start.localOffset;
    const valueEnd = property.value.location.end.localOffset;
    if (offset > property.location.end.localOffset && offset < valueStart) {
      return { kind: "value", key: property.key };
    }
    if (offset >= valueStart && offset <= valueEnd) {
      return { kind: "value", key: property.key };
    }
    if (
      offset >= property.location.start.localOffset &&
      offset <= property.location.end.localOffset
    ) {
      return { kind: "key", key: property.key };
    }
  }
  for (const property of properties) {
    if (
      offset > property.location.end.localOffset &&
      sameLineAfterKey(property)
    ) {
      return { kind: "value", key: property.key };
    }
  }
  return;
};

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

  const focus = focusKeyValue(element.properties, ctx.offset, (property) =>
    isSameLineAs(ctx.snapshot, ctx.offset, property.location)
  );
  if (focus?.kind === "value") {
    return completeValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, MAP_OBJECT_PROPERTY_KEYS, "property");
};
