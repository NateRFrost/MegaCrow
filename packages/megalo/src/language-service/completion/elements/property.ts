import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { slotIndexForParameters } from "src/language-service/completion/context";
import { offsetToPosition } from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

export interface NamedPropertyLike {
  identifier: string;
  location: SourceCodeLocation;
  parameters: readonly ASTParameterNode[];
}

/** True when `offset` falls on the same source line as `location.start`. */
export const isSameLineAs = (
  snapshot: AnalysisSnapshot,
  offset: number,
  location: SourceCodeLocation
): boolean => {
  const { line } = offsetToPosition(snapshot.lineStarts, offset);
  return line + 1 === location.start.line;
};

export type PropertyFocus =
  | { kind: "key"; key: string }
  | { kind: "value"; key: string; slotIndex: number };

const containsOffset = (
  location: SourceCodeLocation,
  offset: number
): boolean =>
  offset >= location.start.localOffset && offset <= location.end.localOffset;

/**
 * Resolve whether the cursor is on a property key or inside its value slots.
 */
export const focusNamedProperty = (
  properties: readonly NamedPropertyLike[],
  offset: number
): PropertyFocus | undefined => {
  for (const property of properties) {
    if (property.parameters.length > 0) {
      const first = property.parameters[0]!;
      const last = property.parameters.at(-1)!;
      const valueStart = first.location.start.localOffset;
      const valueEnd = last.location.end.localOffset;
      if (offset > property.location.end.localOffset && offset < valueStart) {
        return { kind: "value", key: property.identifier, slotIndex: 0 };
      }
      // `end` is exclusive — standing at the end of a finished value is not
      // still editing that token (avoids suggest-after-`"` / completed ids).
      if (offset >= valueStart && offset < valueEnd) {
        return {
          kind: "value",
          key: property.identifier,
          slotIndex: slotIndexForParameters(property.parameters, offset),
        };
      }
    }

    if (containsOffset(property.location, offset)) {
      return { kind: "key", key: property.identifier };
    }
  }
  return;
};

/**
 * Like {@link focusNamedProperty}, but also treats "same line after key with
 * no/incomplete params" as value slot 0 when `sameLine` is true for that property.
 */
export const focusNamedPropertyAllowingEmptyValue = (
  properties: readonly NamedPropertyLike[],
  offset: number,
  sameLineAfterKey: (property: NamedPropertyLike) => boolean
): PropertyFocus | undefined => {
  const hit = focusNamedProperty(properties, offset);
  if (hit !== undefined) {
    return hit;
  }
  for (const property of properties) {
    if (
      offset > property.location.end.localOffset &&
      sameLineAfterKey(property)
    ) {
      // Finished value(s) already occupy the line — don't reopen value suggest
      // when the caret sits after them (e.g. after a closing `"`).
      if (property.parameters.length > 0) {
        const last = property.parameters.at(-1)!;
        if (offset >= last.location.end.localOffset) {
          continue;
        }
      }
      return {
        kind: "value",
        key: property.identifier,
        slotIndex: slotIndexForParameters(property.parameters, offset),
      };
    }
  }
  return;
};

/** True when the caret is on the same line after a property's finished value. */
export const isPastCompletedPropertyValue = (
  properties: readonly NamedPropertyLike[],
  offset: number,
  sameLineAfterKey: (property: NamedPropertyLike) => boolean
): boolean => {
  for (const property of properties) {
    if (property.parameters.length === 0) {
      continue;
    }
    if (
      offset <= property.location.end.localOffset ||
      !sameLineAfterKey(property)
    ) {
      continue;
    }
    const last = property.parameters.at(-1)!;
    if (offset >= last.location.end.localOffset) {
      return true;
    }
  }
  return false;
};

/** Key/value property shape used by map_object / map_permissions / player_rating. */
export interface KeyValuePropertyLike {
  key: string;
  location: SourceCodeLocation;
  value: { location: SourceCodeLocation };
}

/**
 * Resolve whether the cursor is on a key/value property key or inside its value.
 * Value ranges use an exclusive end so a caret after a closing `"` is not treated
 * as still editing that token.
 */
export const focusKeyValueProperty = (
  properties: readonly KeyValuePropertyLike[],
  offset: number,
  sameLineAfterKey: (property: KeyValuePropertyLike) => boolean
): { kind: "key" | "value"; key: string } | undefined => {
  for (const property of properties) {
    const valueStart = property.value.location.start.localOffset;
    const valueEnd = property.value.location.end.localOffset;
    if (offset > property.location.end.localOffset && offset < valueStart) {
      return { kind: "value", key: property.key };
    }
    // `end` is exclusive — standing at/after a finished value is not editing it.
    if (offset >= valueStart && offset < valueEnd) {
      return { kind: "value", key: property.key };
    }
    if (containsOffset(property.location, offset)) {
      return { kind: "key", key: property.key };
    }
  }
  for (const property of properties) {
    if (
      offset > property.location.end.localOffset &&
      sameLineAfterKey(property)
    ) {
      // Finished value already occupies the line — don't reopen value suggest
      // when the caret sits after it (e.g. after a closing `"`). Skip only when
      // there is a real value token past the key (incomplete parses often reuse
      // the key location as a placeholder).
      const valueStartsAfterKey =
        property.value.location.start.localOffset >
        property.location.end.localOffset;
      if (
        valueStartsAfterKey &&
        offset >= property.value.location.end.localOffset
      ) {
        continue;
      }
      return { kind: "value", key: property.key };
    }
  }
  return;
};
