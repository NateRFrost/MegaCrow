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
      if (offset >= valueStart && offset <= valueEnd) {
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
      return {
        kind: "value",
        key: property.identifier,
        slotIndex: slotIndexForParameters(property.parameters, offset),
      };
    }
  }
  return;
};
