import type { Diagnostics, SourceLocation } from "../../diagnostics";
import { markCurrentValueUnused } from "./diagnostics/markCurrentValueUnused";
import type { FieldLocations } from "./locations";

/**
 * Assign a plain IR leaf and record its source location.
 * Warns when overwriting a previous user-authored value.
 */
export const setField = <T extends object, K extends keyof T & string>(
  locations: FieldLocations,
  diagnostics: Diagnostics,
  owner: T,
  key: K,
  value: T[K],
  location: SourceLocation
): void => {
  if (owner[key] !== undefined) {
    markCurrentValueUnused(locations.get(owner, key), diagnostics);
  }
  owner[key] = value;
  locations.record(owner, key, location);
};
