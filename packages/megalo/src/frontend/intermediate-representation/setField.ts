import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { markCurrentValueUnused } from "src/frontend/intermediate-representation/diagnostics/markCurrentValueUnused";
import type { FieldLocations } from "src/frontend/intermediate-representation/locations";

/**
 * Assign a plain IR leaf and record its source location.
 * Warns when overwriting a previous user-authored value.
 *
 * @param name Source-facing field name for unused-override diagnostics
 *   (snake_case when that matches Megalo script, e.g. `"color"`).
 */
export const setField = <T extends object, K extends keyof T & string>(
  locations: FieldLocations,
  diagnostics: Diagnostics,
  owner: T,
  key: K,
  value: T[K],
  location: SourceLocation,
  name: string
): void => {
  if (owner[key] !== undefined) {
    markCurrentValueUnused(
      locations.get(owner, key),
      diagnostics,
      location,
      name
    );
  }
  owner[key] = value;
  locations.record(owner, key, location);
};
