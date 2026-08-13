import type { SourceLocation } from "src/diagnostics";

/**
 * Sidecar source locations for IR leaves.
 * IR fields hold plain values; locations live here for diagnostics.
 */
export interface FieldLocations {
  get(owner: object, key: string): SourceLocation | undefined;
  record(owner: object, key: string, location: SourceLocation): void;
}

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
