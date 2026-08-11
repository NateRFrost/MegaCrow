import type { SourceLocation } from "../diagnostics";
import { SourceLocationType } from "../diagnostics";

/**
 * Sidecar source locations for IR leaves.
 * IR fields hold plain values; locations live here for diagnostics.
 */
export type FieldLocations = {
  record(owner: object, key: string, location: SourceLocation): void;
  get(owner: object, key: string): SourceLocation | undefined;
};

export const createFieldLocations = (): FieldLocations => {
  const table = new WeakMap<object, Map<string, SourceLocation>>();

  return {
    record(owner, key, location) {
      let fields = table.get(owner);
      if (fields === undefined) {
        fields = new Map();
        table.set(owner, fields);
      }
      fields.set(key, location);
    },
    get(owner, key) {
      return table.get(owner)?.get(key);
    },
  };
};
